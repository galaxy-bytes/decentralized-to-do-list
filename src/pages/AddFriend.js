import { useState, useEffect } from 'react';
import { Web5 } from '@web5/api';
export default function AddFriend() {
    const [alias, setAlias] = useState('');
    const [web5Instance, setWeb5Instance] = useState(null);
    const [aliceDid, setAliceDid] = useState(null);
  
    useEffect(() => {
      async function connectToWeb5() {
        const { web5, did } = await Web5.connect();
        setWeb5Instance(web5);
        setAliceDid(did);
      }
      connectToWeb5();
    }, []);
  
    const addFriend = async () => {
      const friendData = {
        '@context': 'https://schema.org/',
        '@type': 'Person',
        alias: alias,
      };
      const { record } = await web5Instance.dwn.records.create({
        data: friendData,
        message: {
          dataFormat: 'application/json',
          schema: 'https://schema.org/Person',
        },
      });
      await record.send(aliceDid);
    };
  
    return (
      <div>
        <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} />
        <button onClick={addFriend}>Add Friend</button>
      </div>
    );
  }
  