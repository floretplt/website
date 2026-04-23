import { PreloaderMark } from "@/components/layout/PreloaderMark";

export default function Loading() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center bg-bg">
      <PreloaderMark />
    </div>
  );
}
