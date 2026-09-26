/**
 * An error whose message is safe to show the user, carrying the HTTP status
 * the API should answer with. Thrown anywhere on the server; turned into a
 * `{ detail }` response by `route()` in lib/route.ts.
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
