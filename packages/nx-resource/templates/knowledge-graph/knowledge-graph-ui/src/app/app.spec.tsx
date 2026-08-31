// GitHub Copilot generated code - start
import React from 'react';
import { render, screen } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('renders the resource title', () => {
    render(<App />);

    const heading = screen.getByRole('heading', {
      name: /knowledge-graph-ui/i,
    });

    expect(heading).toBeTruthy();
  });
});
// GitHub Copilot generated code - end
