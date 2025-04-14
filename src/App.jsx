import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import QRCode from "qrcode.react";
const contractAddress = "0x272036034B17912DC8b112aeB980849A53898aF2"; // Replace after deployment
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_secret",
				"type": "string"
			}
		],
		"name": "checkIn",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_duration",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "attendee",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "CheckIn",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "attendee",
				"type": "address"
			}
		],
		"name": "CheckInRevoked",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "EventReset",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_additionalTime",
				"type": "uint256"
			}
		],
		"name": "extendEndTime",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "resetEvent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_attendee",
				"type": "address"
			}
		],
		"name": "revokeCheckIn",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "newSecretHash",
				"type": "bytes32"
			}
		],
		"name": "SecretUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_secret",
				"type": "string"
			}
		],
		"name": "setSecret",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "attendees",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "endTime",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAttendees",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAttendeesCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "hasCheckedIn",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "secretHash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [secret, setSecret] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const [revokeAddress, setRevokeAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Added for better UX

// Initialize wallet and check admin status
useEffect(() => {
  const initialize = async () => {
    if (!window.ethereum || contract) return; // Skip if no MetaMask or already connected
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) return; // Skip if no account connected

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setContract(contractInstance);

      const adminAddress = await contractInstance.admin();
      setIsAdmin(address.toLowerCase() === adminAddress.toLowerCase());

      const count = await contractInstance.getAttendeesCount();
      setAttendeesCount(count.toNumber());
    } catch (error) {
      console.error("Wallet initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  initialize();
}, []); // Empty deps: run once on mount

// Handle /checkin for public
useEffect(() => {
  const handleCheckIn = async () => {
    if (!contract) return; // Wait for contract
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const secretFromUrl = searchParams.get('secret');
    if (pathname !== '/checkin' || !secretFromUrl) return;

    try {
      setIsLoading(true);
      const tx = await contract.checkIn(secretFromUrl);
      await tx.wait();
      alert("Check-in successful!");
      const count = await contract.getAttendeesCount();
      setAttendeesCount(count.toNumber());
      window.history.replaceState({}, '', '/'); // Clear URL
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("Check-in failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  handleCheckIn();
}, [contract]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);

        const adminAddress = await contractInstance.admin();
        setIsAdmin(address.toLowerCase() === adminAddress.toLowerCase());
        
        await updateAttendeesCount(contractInstance);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet: " + error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const updateAttendeesCount = async (contractInstance) => {
    const count = await contractInstance.getAttendeesCount();
    setAttendeesCount(count.toNumber());
  };

  const setNewSecretAndGenerateQR = async () => {
    if (!newSecret) {
      alert("Please enter a secret");
      return;
    }
    try {
      setIsLoading(true);
      const tx = await contract.setSecret(newSecret);
      await tx.wait();
      setSecret(newSecret);
      setQrUrl(`https://attendencedapp.vercel.app/checkin?secret=${newSecret}`); // Updated to Vercel URL      
      alert("Secret updated and QR code generated!"); 
      setNewSecret('');
    } catch (error) {
      console.error("Error setting secret:", error);
      alert("Failed to set secret: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIn = async () => {
    try {
      setIsLoading(true);
      const secretFromUrl = new URLSearchParams(window.location.search).get('secret');
      if (!secretFromUrl) {
        alert("No secret found in URL");
        return;
      }
      
      const tx = await contract.checkIn(secretFromUrl);
      await tx.wait();
      alert("Check-in successful!");
      await updateAttendeesCount(contract);
      await viewAttendees();
      window.history.replaceState({}, '', '/');
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Check-in failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const viewAttendees = async () => {
    try {
      setIsLoading(true);
      const attendeesList = await contract.getAttendees();
      setAttendees(attendeesList);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      alert("Failed to fetch attendees: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeCheckIn = async () => {
    if (!revokeAddress) {
      alert("Please enter an address to revoke");
      return;
    }
    try {
      setIsLoading(true);
      const tx = await contract.revokeCheckIn(revokeAddress);
      await tx.wait();
      alert("Check-in revoked successfully!");
      await updateAttendeesCount(contract);
      await viewAttendees();
      setRevokeAddress('');
    } catch (error) {
      console.error("Revoke error:", error);
      alert("Failed to revoke check-in: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetEvent = async () => {
    try {
      setIsLoading(true);
      const tx = await contract.resetEvent();
      await tx.wait();
      alert("Event reset successfully! Set a new secret and extend time if needed.");
      setAttendees([]);
      setAttendeesCount(0);
      setQrUrl('');
      setSecret('');
    } catch (error) {
      console.error("Reset error:", error);
      alert("Failed to reset event: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Offline Attendance DApp</h1>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="text-sm text-gray-600 mb-2">
          Connected Account: {account || "Not connected"}
        </p>
        <button
          onClick={connectWallet}
          disabled={isLoading}
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {isAdmin && (
          <p className="text-green-600 font-semibold mt-2">You are the Admin!</p>
        )}
      </div>

      {isAdmin && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>
          
          {/* Set Secret */}
          <input
            type="text"
            value={newSecret}
            onChange={(e) => setNewSecret(e.target.value)}
            placeholder="Enter new secret"
            className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={setNewSecretAndGenerateQR}
            disabled={isLoading}
            className={`w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Set Secret & Generate QR'}
          </button>
          {qrUrl && (
            <div className="mt-4 flex flex-col items-center">
              <h3 className="text-lg font-medium mb-2">Share this QR Code:</h3>
              <QRCode value={qrUrl} size={256} />
            </div>
          )}

          {/* Revoke Check-In */}
          <input
            type="text"
            value={revokeAddress}
            onChange={(e) => setRevokeAddress(e.target.value)}
            placeholder="Enter address to revoke"
            className="w-full p-2 border rounded mt-4 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={revokeCheckIn}
            disabled={isLoading}
            className={`w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Revoke Check-In'}
          </button>

          {/* Reset Event */}
          <button
            onClick={resetEvent}
            disabled={isLoading}
            className={`w-full bg-yellow-500 text-white py-2 px-4 rounded mt-4 hover:bg-yellow-600 transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Reset Event'}
          </button>
        </div>
      )}

      <div className="mt-6 flex space-x-4">
        <button
          onClick={checkIn}
          disabled={isLoading}
          className={`bg-purple-500 text-white py-2 px-6 rounded hover:bg-purple-600 transition ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Checking In...' : 'Check In'}
        </button>
        <button
          onClick={viewAttendees}
          disabled={isLoading}
          className={`bg-indigo-500 text-white py-2 px-6 rounded hover:bg-indigo-600 transition ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Loading...' : 'View Attendees'}
        </button>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="text-lg font-medium">Total Attendees: {attendeesCount}</p>
        {attendees.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Attendees List:</h3>
            <ul className="list-disc list-inside text-left">
              {attendees.map((attendee, index) => (
                <li key={index} className="text-gray-700">{attendee}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;