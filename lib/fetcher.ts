export async function loggingFetcher(url: string, opts?: RequestInit) {
  try {
    // Log before fetch
    // eslint-disable-next-line no-console
    console.log(`[fetch] -> ${url}`, opts || {});

    const res = await fetch(url, opts);

    let body: any = null;
    try {
      body = await res.json();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[fetch] unable to parse JSON from ${url}`, err);
    }

    // Log after fetch
    // eslint-disable-next-line no-console
    console.log(`[fetch] <- ${url}`, { status: res.status, ok: res.ok, body });

    // (temporary raw-json logging removed in final cleanup)

    if (!res.ok) {
      const err = new Error(`Fetch error ${res.status} for ${url}`);
      // @ts-ignore
      err.status = res.status;
      // eslint-disable-next-line no-console
      console.error(err);
      throw err;
    }

    return body;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[fetch] error ${url}`, err);
    throw err;
  }
}
