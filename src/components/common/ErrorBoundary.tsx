import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Catches render errors (e.g. unexpected state) and offers a recovery path
 * instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
    // Return to a known-good destination.
    window.location.hash = "#/plays";
  };

  render() {
    if (this.state.error) {
      return (
        <div className="page error-screen">
          <h1>Something went sideways</h1>
          <p className="muted">The guide hit an unexpected state. Resetting usually clears it.</p>
          <button type="button" className="primary-button" onClick={this.reset}>
            Reset and go to Plays
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
