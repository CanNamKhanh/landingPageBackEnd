import "dotenv/config";
import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ── Lấy access token ──────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const res = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID!,
        password: process.env.PAYPAL_CLIENT_SECRET!,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10_000,
    },
  );
  return res.data.access_token;
}

// ── POST /paypal/create-invoice ───────────────────────────────────────────────
router.post("/create-invoice", async (req: Request, res: Response) => {
  const { customerName, customerEmail, serviceLabel, amount, note } = req.body;

  if (!customerName || !customerEmail || !amount) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: "Invalid amount." });
    return;
  }

  try {
    const token = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 1. Tạo draft invoice
    const invoiceRes = await axios.post(
      `${PAYPAL_BASE}/v2/invoicing/invoices`,
      {
        detail: {
          invoice_number: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          currency_code: "USD",
          note: note ?? "Thank you for choosing RosieBoost!",
          payment_term: { term_type: "DUE_ON_RECEIPT" },
        },
        invoicer: {
          name: { given_name: process.env.SHOP_NAME ?? "RosieBoost" },
          email_address: process.env.PAYPAL_INVOICER_EMAIL!,
        },
        primary_recipients: [
          {
            billing_info: {
              name: { full_name: customerName },
              email_address: customerEmail,
            },
          },
        ],
        items: [
          {
            name: serviceLabel ?? "Boosting Service",
            description: serviceLabel ?? "Boosting Service",
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: amountNum.toFixed(2),
            },
            unit_of_measure: "QUANTITY",
          },
        ],
        amount: {
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: amountNum.toFixed(2),
            },
          },
        },
      },
      { headers, timeout: 15_000 },
    );

    // invoiceRes.data = { rel: 'self', href: '…/invoices/INV2-xxx', method: 'GET' }
    console.log("Invoice response data:", JSON.stringify(invoiceRes.data));

    const invoiceId: string = invoiceRes.data.href?.split("/").pop()!;
    if (!invoiceId) {
      console.error("Could not parse invoice id from:", invoiceRes.data);
      res
        .status(500)
        .json({ error: "Could not parse invoice id from PayPal response." });
      return;
    }

    console.log("Invoice ID:", invoiceId);

    // 2. Gửi invoice → PayPal tự gửi email cho khách
    await axios.post(
      `${PAYPAL_BASE}/v2/invoicing/invoices/${invoiceId}/send`,
      { send_to_recipient: true },
      { headers, timeout: 15_000 },
    );

    console.log("Invoice sent to recipient:", customerEmail);

    // 3. Lấy link thanh toán trả về FE
    const detailRes = await axios.get(
      `${PAYPAL_BASE}/v2/invoicing/invoices/${invoiceId}`,
      { headers, timeout: 10_000 },
    );

    const payLink: string =
      detailRes.data.detail?.metadata?.payer_view_url ??
      detailRes.data.links?.find((l: { rel: string }) => l.rel === "payer-view")
        ?.href ??
      "";

    console.log("Pay link:", payLink);

    res.json({ success: true, invoiceId, payLink });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        "PayPal error:",
        JSON.stringify(err.response?.data ?? err.message),
      );
      res.status(502).json({ error: err.response?.data ?? "PayPal API error" });
    } else {
      console.error("Unexpected error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
