import { Component } from 'react'

export default class PreviewBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed
      ? <p className="preview-message" role="status">{this.props.message}</p>
      : this.props.children
  }
}
