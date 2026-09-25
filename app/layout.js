import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: "NorskDive — Norsk for Norskprøven",
  description: "Øv til Norskprøven: lesing, lytting, skriving og muntlig, nivå A1–B2.",
};

// Browser translators (Chrome, Edge, Safari, Firefox and extensions) replace
// text nodes with their own <font> wrappers. React later tries to remove or
// insert next to the original nodes, which no longer sit where it expects,
// and throws "Failed to execute 'removeChild'". This guard makes those two
// DOM calls tolerant so a translated page keeps working instead of crashing.
// See https://github.com/facebook/react/issues/11538
const translateGuard = `(function(){
  if (typeof Node !== 'function' || !Node.prototype) return;
  var rc = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child){
    if (child.parentNode !== this) return child;
    return rc.apply(this, arguments);
  };
  var ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(node, ref){
    if (ref && ref.parentNode !== this) return ib.call(this, node, null);
    return ib.apply(this, arguments);
  };
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="nb">
      <head>
        <script dangerouslySetInnerHTML={{ __html: translateGuard }} />
      </head>
      <body style={{ margin: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
