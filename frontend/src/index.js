// Entry point for webpack
import { main } from './Main.purs';

// Initialize the PureScript application
if (module.hot) {
  module.hot.accept();
}

main();