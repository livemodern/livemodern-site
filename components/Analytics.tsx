import Script from "next/script";

/**
 * Site-wide tag loader, rendered once from app/layout.tsx.
 *
 * Every script is env-gated — nothing loads in the browser until the matching
 * env var is set on Vercel, so this is safe to ship before the IDs exist.
 *
 *   NEXT_PUBLIC_GTM_ID            GTM-XXXXXXX     — one container that can then
 *                                                   fire GA4, Ads, Meta, etc.
 *                                                   Recommended single path.
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID G-XXXXXXXXXX    — GA4 direct, if you skip GTM.
 *                                                   Don't set both.
 *   NEXT_PUBLIC_META_PIXEL_ID     16-digit id     — Meta retargeting; can run
 *                                                   alongside either.
 *
 * These are for ad-platform optimization and Google's reporting. The
 * source-of-truth event stream for MLG Admin is the first-party tracker
 * (lib/site-tracker.ts -> /api/track -> site_events), which no ad blocker
 * can drop.
 */
export default function Analytics() {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {GTM_ID && (
        <>
          <Script
            id="gtm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

      {!GTM_ID && GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`,
            }}
          />
        </>
      )}

      {META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
          }}
        />
      )}
    </>
  );
}
