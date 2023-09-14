import { useState, useEffect } from 'react';
import { Web5 } from '@web5/api';
import Head from 'next/head';

export default function Todo() {
  const [web5Instance, setWeb5Instance] = useState(null);
  const [aliceDid, setAliceDid] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskValue, setEditTaskValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    async function connectToWeb5() {
      const { web5, did } = await Web5.connect();
      setWeb5Instance(web5);
      setAliceDid(did);
      setLoading(true);

      const taskResponse = await web5.dwn.records.query({
        from: did,
        message: {
          filter: {
            dataFormat: 'application/json',
            schema: 'https://schema.org/Action',
          },
        },
      });

      const friendResponse = await web5.dwn.records.query({
        from: did,
        message: {
          filter: {
            dataFormat: 'application/json',
            schema: 'https://schema.org/Person',
          },
        },
      });

      const taskList = await Promise.all(
        taskResponse.records.map(async (record) => {
          const data = await record.data.json();
          return { id: record.id, text: data.name };
        })
      );

      const friendList = await Promise.all(
        friendResponse.records.map(async (record) => {
          const data = await record.data.json();
          return { did: record.id, alias: data.alias };
        })
      );

      setTasks(taskList.filter((task) => task !== null));
      setFriends(friendList);
      setLoading(false);
    }

    connectToWeb5();
  }, []);

  async function addTask(event) {
    event.preventDefault(); // Prevent form from submitting and refreshing the page
    if (web5Instance && aliceDid && newTask.trim() !== '') {
      const taskData = {
        '@context': 'https://schema.org/',
        '@type': 'Action',
        name: newTask,
        completed: false, // Add this line
      };

      const { record } = await web5Instance.dwn.records.create({
        data: taskData,
        message: {
          dataFormat: 'application/json',
          schema: 'https://schema.org/Action',
        },
      });

      // Send the record to the DWN.
      await record.send(aliceDid);

      setTasks((prevTasks) => [...prevTasks, { id: record.id, text: newTask }]);
      setNewTask('');
    }
  }


  async function deleteTask(id) {
    if (web5Instance && aliceDid) {
      await web5Instance.dwn.records.delete({
        from: aliceDid,
        message: {
          recordId: id,
        },
      });
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    }
  }

  async function updateTask(id) {
    if (web5Instance && aliceDid) {
      const { record } = await web5Instance.dwn.records.read({
        from: aliceDid,
        message: {
          recordId: id,
        },
      });

      await record.update({ data: editTaskValue });
      // Send the updated record to the DWN.
      await record.send(aliceDid);
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? { ...task, text: editTaskValue } : task)));
      setEditTaskId(null);
      setEditTaskValue('');
    }
  }
  const shareTask = async (taskId, friendDid) => {
    // Find the task by its ID
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found');
      return;
    }
  
    // Create a new record for the task
    const taskData = {
      '@context': 'https://schema.org/',
      '@type': 'Action',
      name: task.text,
      completed: false,
    };
  
    const { record } = await web5Instance.dwn.records.create({
      data: taskData,
      message: {
        dataFormat: 'application/json',
        schema: 'https://schema.org/Action',
      },
    });
  
    // Send the record to the friend's DWN
    const { status } = await record.send(friendDid);
    if (status !== 'success') {
      console.error('Failed to send task to friend');
    }
  };
  

  return (
    <div>
      <Head>
        <title>Web5 To Do App</title>
      </Head>
      <h1>To Do</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <form onSubmit={addTask}>
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task" />
            <button type="submit">Add task</button>
          </form>
          <ul>
            {tasks.map((task, index) => (
              <li key={index}>
                {editTaskId === task.id ? (
                  <div>
                    <input type="text" value={editTaskValue} onChange={(e) => setEditTaskValue(e.target.value)} />
                    <button onClick={() => updateTask(task.id)}>Update</button>
                    <button onClick={() => setEditTaskId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <span>{task.text}</span>
                    <button onClick={() => { setEditTaskId(task.id); setEditTaskValue(task.text); }}>Edit</button>
                    <button onClick={() => deleteTask(task.id)}>Delete</button>
                    <select onChange={(e) => shareTask(task.id, e.target.value)}>
                      <option value="">Share with...</option>
                      {friends.map((friend, i) => (
                        <option key={i} value={friend.did}>{friend.alias}</option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}






// ADD alias
// import { useState, useEffect } from 'react';
// import { Web5 } from '@web5/api';

// export default function ShareTasks() {
//   const [web5Instance, setWeb5Instance] = useState(null);
//   const [did, setDid] = useState(null);
//   const [alias, setAlias] = useState('');
//   const [allAliases, setAllAliases] = useState([]);
//   const [selectedAlias, setSelectedAlias] = useState('');
//   const [taskToShare, setTaskToShare] = useState('');

//   useEffect(() => {
//     async function connectToWeb5() {
//       const { web5, did } = await Web5.connect();
//       setWeb5Instance(web5);
//       setDid(did);
//     }
//     connectToWeb5();
//   }, []);

//   const addAlias = async () => {
//     const aliasData = {
//       '@context': 'https://schema.org/',
//       '@type': 'Person',
//       alias,
//       did,
//     };
//     const { record } = await web5Instance.dwn.records.create({
//       data: aliasData,
//       message: {
//         dataFormat: 'application/json',
//         schema: 'https://schema.org/Person',
//       },
//     });
//     await record.send(did);
//     setAllAliases([...allAliases, { alias, did }]);
//   };

//   const shareTask = async () => {
//     const targetDid = allAliases.find((a) => a.alias === selectedAlias)?.did;
//     if (targetDid) {
//       const taskData = {
//         '@context': 'https://schema.org/',
//         '@type': 'Action',
//         name: taskToShare,
//       };
//       const { record } = await web5Instance.dwn.records.create({
//         data: taskData,
//         message: {
//           dataFormat: 'application/json',
//           schema: 'https://schema.org/Action',
//         },
//       });

//       console.log(record)
//       console.log(targetDid)
//       await record.send(targetDid);
//     }
//   };

//   return (
//     <div>
//       <h1>Share Tasks</h1>

//       {/* Alias Submission Form */}
//       <div>
//         <input
//           type="text"
//           placeholder="Your Alias"
//           value={alias}
//           onChange={(e) => setAlias(e.target.value)}
//         />
//         <button onClick={addAlias}>Add Alias</button>
//       </div>

//       {/* List of Aliases */}
//       <div>
//         <h2>All Aliases</h2>
//         <ul>
//           {allAliases.map((a, index) => (
//             <li key={index}>{a.alias}</li>
//           ))}
//         </ul>
//       </div>

//       {/* Share Task */}
//       <div>
//         <h2>Share a Task</h2>
//         <input
//           type="text"
//           placeholder="Task to Share"
//           value={taskToShare}
//           onChange={(e) => setTaskToShare(e.target.value)}
//         />
//         <select onChange={(e) => setSelectedAlias(e.target.value)}>
//           <option value="">Select Alias</option>
//           {allAliases.map((a, index) => (
//             <option key={index} value={a.alias}>
//               {a.alias}
//             </option>
//           ))}
//         </select>
//         <button onClick={shareTask}>Share Task</button>
//       </div>
//     </div>
//   );
// }
