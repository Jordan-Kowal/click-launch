import { TriangleAlert } from "lucide-solid";

type ErrorFallbackProps = {
  error: Error;
  reset: () => void;
};

export const ErrorFallback = (props: ErrorFallbackProps) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div class="flex items-center justify-center min-h-screen bg-base-200 p-8">
      <div class="card bg-base-100 shadow-lg max-w-md w-full">
        <div class="card-body items-center text-center gap-4">
          <div class="text-warning">
            <TriangleAlert size={48} strokeWidth={1.5} />
          </div>
          <h2 class="card-title text-base-content">Something went wrong</h2>
          <p class="text-base-content/60 text-sm">
            An unexpected error occurred. You can try again or reload the app.
          </p>
          <pre class="bg-base-200 rounded-box p-3 text-xs text-error w-full overflow-x-auto text-left max-h-32">
            {props.error.message || "Unknown error"}
          </pre>
          <div class="card-actions gap-2 mt-2">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onClick={props.reset}
            >
              Try again
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onClick={handleReload}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
