import react from 'react';
import React from 'react';
import Broker from './Broker/Broker';
import Navbar from './Navbar/Navbar';
import { tokenApi } from '../services/Token';

const Home = () => {
  async function getToken() {
    return await tokenApi.get('token').then((response) => response.data.token);
  }

  async function getMessage() {
    let token = await getToken();
    let message = await tokenApi.post('/message', { token: token });
    if (message.status === 200) {
      console.log(message.data.mensagem);
      alert(message.data.mensagem);
      return message.data.mensagem;
    }
  }
  react.useEffect(() => {
    getMessage();
  }, []);
  return (
    <>
      <Navbar />
      <Broker />
      {/* <TestButton /> */}
    </>
  );
};

export default Home;
