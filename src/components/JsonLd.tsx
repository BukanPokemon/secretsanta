// Renders a JSON-LD structured data block. Plain <script> tag rather than a
// head-management library — it just needs to exist in the DOM by the time
// the prerender script captures the page, same as useDocumentMeta.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
