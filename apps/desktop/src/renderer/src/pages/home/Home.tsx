import { Button } from '@craft-studio/ui/src/components/Button';
import { ArrowUpIcon } from "lucide-react"
export function HomePage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">欢迎来到 Electron 应用</h1>
        <p className="mb-4 text-gray-600">这是一个使用 React Router 的简单页面示例</p>
        <Button variant="outline">Button</Button>
        <Button variant="outline" size="icon" aria-label="Submit">
          <ArrowUpIcon />
        </Button>
      </div>
    </div>
  );
}
