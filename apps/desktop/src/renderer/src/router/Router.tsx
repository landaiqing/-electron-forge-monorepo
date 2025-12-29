import { HashRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/home/Home';

const Router = () => {
  return (
    <HashRouter>
      <div className="flex h-full w-full flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default Router;
