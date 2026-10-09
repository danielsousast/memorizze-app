import { Component, type ReactNode } from "react";
import { Text } from "react-native";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class RealmErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <Text>Não foi possível abrir o banco de dados.</Text>;
    }
    return this.props.children;
  }
}
