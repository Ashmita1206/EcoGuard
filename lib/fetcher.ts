export async function loggingFetcher(url: string, opts?: RequestInit) {
  try {
    // Attempt fetch

    const res = await fetch(url, opts);

    let body: any = null;
    try {
      body = await res.json();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[fetch] unable to parse JSON from ${url}`, err);
    }

    // Standardized API response log for frontend tracing
    // eslint-disable-next-line no-console
    console.log("API RESPONSE:", url, body);

    // (temporary raw-json logging removed in final cleanup)

    if (!res.ok) {
      const err = new Error(`Fetch error ${res.status} for ${url}`);
      // @ts-ignore
      err.status = res.status;
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }

    // Return the data field if it exists (for new standardized format)
    // Otherwise return the entire body for backward compatibility
    return body.data !== undefined ? body.data : body;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[fetch] error ${url}`, err);
    throw err;
  }
}
