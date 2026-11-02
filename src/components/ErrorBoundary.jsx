import { Component } from 'react';

// Ichidagi qism ishlamay qolsa, butun sayt oq ekranga aylanmasin: o'rniga `fallback` ko'rsatiladi
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
