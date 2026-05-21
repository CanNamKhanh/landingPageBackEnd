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
    },
  );
  return res.data.access_token;
}

// ── POST /paypal/create-invoice ───────────────────────────────────────────────
router.post("/create-invoice", async (req: Request, res: Response) => {
  const {
    customerName,
    customerEmail,
    serviceLabel, // ví dụ: "Tft Rank Boost · AP · Iron 1 → Gold 4"
    amount, // số tiền USD (number)
    note, // tuỳ chọn
  } = req.body;

  if (!customerName || !customerEmail || !amount) {
    res.status(400).json({ error: "Missing required fields." });
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
          invoice_number: `INV-${Date.now()}`,
          currency_code: "USD",
          note: note ?? "Thank you for choosing RosieBoost!",
          payment_term: { term_type: "DUE_ON_RECEIPT" },
        },
        invoicer: {
          // Thông tin shop của bạn — điền vào .env
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
            description: serviceLabel,
            quantity: "1",
            unit_amount: {
              currency_code: "USD",
              value: Number(amount).toFixed(2),
            },
            unit_of_measure: "QUANTITY",
          },
        ],
        amount: {
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: Number(amount).toFixed(2),
            },
          },
        },
      },
      { headers },
    );

    const invoiceId: string = invoiceRes.data.href.split("/").pop()!;

    // 2. Gửi invoice → PayPal tự gửi email cho khách
    await axios.post(
      `${PAYPAL_BASE}/v2/invoicing/invoices/${invoiceId}/send`,
      { send_to_recipient: true },
      { headers },
    );

    // 3. Lấy link thanh toán trả về FE (tuỳ chọn hiển thị)
    const detailRes = await axios.get(
      `${PAYPAL_BASE}/v2/invoicing/invoices/${invoiceId}`,
      { headers },
    );

    const payLink: string =
      detailRes.data.detail?.metadata?.payer_view_url ??
      detailRes.data.links?.find((l: { rel: string }) => l.rel === "payer-view")
        ?.href ??
      "";

    res.json({ success: true, invoiceId, payLink });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("PayPal error:", err.response?.data ?? err.message);
      res.status(500).json({ error: err.response?.data ?? "PayPal API error" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
