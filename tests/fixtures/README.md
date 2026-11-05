# Analyzer fixtures

`apk.ts` builds synthetic ZIP, binary XML and APK signing-block structures. These are parser fixtures, not cryptographically signed applications.

`isrg-root-x1.der` is the public ISRG Root X1 certificate from the system CA bundle (Internet Security Research Group / Let's Encrypt). It contains no private key. Its independently checked OpenSSL SHA-256 fingerprint is:

`96:BC:EC:06:26:49:76:F3:74:60:77:9A:CF:28:C5:A7:CF:E8:A3:C0:AA:E1:1A:8F:FC:EE:05:C0:BD:DF:08:C6`

It tests exact DER fingerprint extraction in synthetic containers; it does not sign the fixtures or establish any trust in an APK.
