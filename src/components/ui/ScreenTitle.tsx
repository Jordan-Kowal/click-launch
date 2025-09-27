import { useNavigate } from "@solidjs/router";
import { ArrowLeft } from "lucide-solid";
import { Show } from "solid-js";

type ScreenTitleProps = {
  title: string;
  backHref?: string;
};

export const ScreenTitle = (props: ScreenTitleProps) => {
  const navigate = useNavigate();

  return (
    <div class="flex items-center gap-1 align-middle">
      <Show when={props.backHref}>
        <button
          type="button"
          class="btn btn-square btn-ghost"
          onClick={() => navigate(props.backHref!)}
        >
          <ArrowLeft />
        </button>
      </Show>
      <h2 class="!m-0">{props.title}</h2>
    </div>
  );
};
