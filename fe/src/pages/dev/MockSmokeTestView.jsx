import React from "react";

/**
 * Presentation layer – nhận tất cả data và handler qua props.
 * Không có state, không gọi service.
 */
export function MockSmokeTestView({ data }) {
  if (data.loading) return <div>Loading mock smoke test...</div>;
  if (data.error) return <pre style={{ color: "red" }}>{data.error}</pre>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Mock Smoke Test</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
