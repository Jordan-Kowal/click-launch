const style = { width: "60px" };

export const LoadingRing = () => {
  return (
    <div class="flex flex-col items-center justify-center">
      <span class="loading loading-ring mx-auto" style={style} />
      <span class="text-sm">Loading...</span>
    </div>
  );
};
