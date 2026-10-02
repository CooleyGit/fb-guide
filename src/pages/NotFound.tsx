import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page not-found">
      <h1>That play isn’t here</h1>
      <p className="muted">
        The link you followed doesn’t match a page in this guide. No problem—reset and get back to work.
      </p>
      <Link className="primary-button" to="/plays">
        Go to Plays
      </Link>
    </div>
  );
}
