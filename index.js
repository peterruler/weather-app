import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);

// Ensure environments that import `index.js` directly (e.g., some online runners)
// can render by providing a default export.
export default App;
