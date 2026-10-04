export const handleRequest = async (
  request: Request,
  handle: () => Promise<Response>
): Promise<Response> => {
  // srvx initializes its abort listener lazily; capture the signal before any async context lookup.
  const { signal } = request;
  if (signal.aborted) {
    return new Response(null, { status: 499 });
  }
  try {
    return await handle();
  } catch (error) {
    if (signal.aborted) {
      return new Response(null, { status: 499 });
    }
    throw error;
  }
};
