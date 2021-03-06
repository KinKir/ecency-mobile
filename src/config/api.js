import axios from 'axios';
import Config from 'react-native-config';
import VersionNumber from 'react-native-version-number';

const api = axios.create({
  baseURL: Config.BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': `${Config.USER_AGENT}/${VersionNumber.appVersion}`,
  },
});

export default api;

export const cancelToken = axios.CancelToken.source();
