import Script from 'next/script';

// Renders nothing when NEXT_PUBLIC_GA4_ID is unset.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA4_ID?.trim();
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
