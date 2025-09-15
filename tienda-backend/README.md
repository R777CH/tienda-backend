# Tienda Backend (prototype)

Backend Node/Express para una tienda con:
- Catálogo (`/products`)
- Pagos: Stripe (PaymentIntent), PayPal (Orders Capture)
- Pago manual: CashApp / Venmo (crea orden y sube comprobante)
- Endpoints para órdenes y administración básica

## Instalación local
1. Clona el repo
2. `npm install`
3. Crea `.env` (usa `.env.example` como guía)
4. `npm run dev` (necesitas nodemon) o `npm start`

## Variables de entorno (ejemplo)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

STRIPE_SECRET_KEY=...

CASHAPP_HANDLE=R777CH
VENMO_LINK=https://venmo.com/tuUsuario

PORT=4242

## Endpoints principales
- `GET /products` - lista de productos
- `GET /products/:id` - detalle
- `POST /payments/create-stripe-payment-intent` - body: `{ items: [...] }` → devuelve `clientSecret`
- `POST /payments/create-paypal-order` - body: `{ items: [...] }` → devuelve `id` y `links` (approve)
- `POST /payments/capture-paypal-order` - body: `{ orderId }` → captura y marca orden como pagada
- `POST /payments/create-cashapp-order` - crea orden pendente con link a Cash App
- `POST /payments/create-venmo-order` - crea orden pendente con link a Venmo
- `POST /orders` - crear orden general
- `POST /orders/:id/upload` - subir comprobante (`multipart/form-data` campo `receipt`)
- `POST /orders/:id/approve` - marcar orden como pagada (admin)
