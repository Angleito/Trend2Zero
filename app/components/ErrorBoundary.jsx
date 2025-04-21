"use client";
import React, { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: undefined
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Optional error logging or reporting
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }
    render() {
        if (this.state.hasError) {
            // Render fallback UI
            return this.props.fallback || (<div role="alert" className="error-boundary">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        </div>);
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
