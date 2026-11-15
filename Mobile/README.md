# Odo Mobile

Flutter client for the Odo authentication API. It mirrors the web workflow:
registration, email verification and resend, login, session refresh, password
recovery/reset, password change, and logout.

## Run on a physical phone

1. Put the laptop and phone on the same network.
2. Set `HOST=0.0.0.0` in `Api/.env` so the API accepts LAN connections.
3. Find the laptop's LAN IP address (for example, `192.168.1.20`).
4. Start the API, then launch Flutter with the address supplied at build time:

   ```sh
   flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000
   ```

The default API URL is `http://10.0.2.2:3000`, which is convenient for an
Android emulator but is not the laptop address from a physical phone.

Local HTTP traffic is enabled for development. Use an HTTPS API URL for a
production build.

## Email links

The app accepts these custom links:

- `odo://confirm-email?token=...`
- `odo://reset-password?token=...`

To test the full mobile email flow, set these values in `Api/.env` before
starting the API:

```dotenv
EMAIL_VERIFICATION_URL=odo://confirm-email
PASSWORD_RESET_URL=odo://reset-password
```

Keep the existing `http://localhost:5173/...` values when links should open the
web client instead.
