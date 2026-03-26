import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';

test('renders login page when not authenticated', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
  const loginElement = screen.getByText(/Sign in to access dashboard/i);
  expect(loginElement).toBeInTheDocument();
});