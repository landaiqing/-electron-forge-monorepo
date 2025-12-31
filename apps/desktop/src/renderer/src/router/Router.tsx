import { HashRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/home/Home';
import { TitleBar } from '@/components';

const Router = () => {
  return (
    <HashRouter>
      <div className="flex h-full w-full flex-col">
        {/* 自定义标题栏 */}
        <TitleBar />
        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
};

export default Router;
