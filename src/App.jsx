import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import QRCode from "qrcode.react";
import { ToastContainer, toast } from 'react-toastify'; // For better notifications
import 'react-toastify/dist/ReactToastify.css'; // Styles for toast

// ==========================================================================
const contractAddress = "0x84aE0eDF89DDBDa29d9d555A459a324ceB72704d";
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "AdminChanged",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newAdmin",
				"type": "address"
			}
		],
		"name": "changeAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
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
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newEndTime",
				"type": "uint256"
			}
		],
		"name": "SecretAndEndTimeUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_secret",
				"type": "string"
			},
			{
				"internalType": "uint256",

				"name": "_endTime",
				"type": "uint256"
			}
		],
		"name": "setSecretAndEndTime",
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
		"name": "checkInEndTime",
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
		"inputs": [],
		"name": "getCheckInEndTime",
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
				"name": "_attendee",
				"type": "address"
			}
		],
		"name": "hasAttendeeCheckedIn",
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


// --- Helper Function to Parse Errors ---
function getRevertReason(error) {
    let reason = error.message; // Default message
    // Ethers v5 specific error structure
    if (error.error && error.error.message) { // Check for embedded error
      reason = error.error.message;
    } else if (error.data && error.data.message) { // Check for data message
      reason = error.data.message;
    } else if (error.reason) { // Check for reason field
        reason = error.reason;
    }

    // Try to extract Solidity revert reason
    const revertPrefix = "execution reverted: ";
    if (reason.includes(revertPrefix)) {
        reason = reason.substring(reason.indexOf(revertPrefix) + revertPrefix.length);
    }
    // Remove potential extra info added by providers
    reason = reason.split('\'')[0].split('\"')[0].trim();
    return reason || "Transaction failed. Check console for details."; // Fallback
}


function App() {
  // --- State Variables ---
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userMessage, setUserMessage] = useState(''); // For general feedback

  // Admin state
  const [adminSecret, setAdminSecret] = useState('');
  const [adminEndDateTime, setAdminEndDateTime] = useState(''); // Human-readable date-time input
  const [qrUrl, setQrUrl] = useState('');
  const [revokeAddress, setRevokeAddress] = useState('');

  // Attendee state
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const [currentEndTime, setCurrentEndTime] = useState(null); // Store current end time from contract
  const [hasUserCheckedIn, setHasUserCheckedIn] = useState(null); // null = unknown, true/false

  // --- Effects ---

  // Initialize connection and check URL on load
  useEffect(() => {
    const initialize = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        // Try to eagerly connect if already permitted
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          await connectWallet(); // Connect fully if account is found
        } else {
            setUserMessage("Please connect your wallet.");
        }
      } else {
        toast.error("Please install a web3 wallet like MetaMask!");
        setUserMessage("MetaMask or another web3 wallet is required.");
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Fetch data when contract is available
  const fetchContractData = useCallback(async (currentContract, userAddress) => {
    if (!currentContract || !userAddress) return;
    console.log("Fetching contract data...");
    setIsLoading(true);
    try {
        const [adminAddr, count, endTimeSeconds, checkedInStatus] = await Promise.all([
            currentContract.admin(),
            currentContract.getAttendeesCount(),
            currentContract.getCheckInEndTime(),
            currentContract.hasAttendeeCheckedIn(userAddress) // Check if current user checked in
        ]);

        setIsAdmin(userAddress.toLowerCase() === adminAddr.toLowerCase());
        setAttendeesCount(count.toNumber());
        setCurrentEndTime(endTimeSeconds.toNumber() > 0 ? new Date(endTimeSeconds.toNumber() * 1000) : null);
        setHasUserCheckedIn(checkedInStatus);
        console.log("Admin:", adminAddr, "Is User Admin:", userAddress.toLowerCase() === adminAddr.toLowerCase());
        console.log("End Time (seconds):", endTimeSeconds.toNumber());
        console.log("User Checked In:", checkedInStatus);

    } catch (error) {
        console.error("Error fetching contract data:", error);
        toast.error("Could not load contract data. Is the network correct?");
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies that change frequently

  // Re-fetch data when account changes
  useEffect(() => {
    if (contract && account) {
      fetchContractData(contract, account);
    }
  }, [account, contract, fetchContractData]);

  // Handle check-in from URL parameters
  useEffect(() => {
    const handleCheckInFromUrl = async () => {
        if (!contract || !signer || !account) return; // Ensure everything is ready

        const searchParams = new URLSearchParams(window.location.search);
        const secretFromUrl = searchParams.get('secret');

        if (window.location.pathname === '/checkin' && secretFromUrl) {
            console.log("Attempting check-in from URL...");
            // Optional: Add a small delay to ensure wallet is fully ready if needed
            // await new Promise(resolve => setTimeout(resolve, 500));

            // Clear the URL parameters to avoid re-triggering
            window.history.replaceState({}, document.title, window.location.pathname.replace('/checkin', '/'));

            await performCheckIn(secretFromUrl); // Use the main check-in function
        }
    };

    handleCheckInFromUrl();
    // Depend on contract, signer, and account being ready
  }, [contract, signer, account]); // Rerun when these change

  // --- Wallet Connection ---
  const connectWallet = async () => {
    if (!provider) {
      toast.error("Web3 provider not found. Please install MetaMask.");
      return;
    }
    setIsLoading(true);
    setUserMessage("Connecting...");
    try {
      await provider.send("eth_requestAccounts", []); // Request connection
      const currentSigner = provider.getSigner();
      const currentAddress = await currentSigner.getAddress();
      const currentContract = new ethers.Contract(contractAddress, contractABI, currentSigner);

      setSigner(currentSigner);
      setAccount(currentAddress);
      setContract(currentContract);
      setUserMessage(""); // Clear connection message

      toast.success(`Wallet connected: ${currentAddress.substring(0, 6)}...${currentAddress.substring(currentAddress.length - 4)}`);

      // Fetch data immediately after connecting
      await fetchContractData(currentContract, currentAddress);

    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet. See console.");
      setUserMessage("Connection failed.");
      setAccount('');
      setSigner(null);
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Core Actions ---

  const executeTransaction = async (txFunction, successMessage, ...args) => {
    if (!contract || !signer) {
        toast.error("Wallet not connected or contract not loaded.");
        return false;
    }
    setIsLoading(true);
    try {
        // Estimate Gas first (optional but good practice)
        // const estimatedGas = await txFunction.estimateGas(...args);
        // console.log("Estimated Gas:", estimatedGas.toString());
        // const tx = await txFunction(...args, { gasLimit: estimatedGas.add(estimatedGas.div(10)) }); // Add 10% buffer

        // Simpler: let wallet estimate
        const tx = await txFunction(...args);
        console.log(`Transaction sent: ${tx.hash}`);
        toast.info(`Transaction submitted (${tx.hash.substring(0, 8)}...). Waiting for confirmation...`, { autoClose: 5000 });

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        toast.success(`${successMessage} (Block: ${receipt.blockNumber})`);

        // Refresh relevant data after successful transaction
        await fetchContractData(contract, account); // Refresh general data
        if (successMessage.includes("Attendees")) { // Be more specific if needed
             await viewAttendees(); // Refresh attendee list specifically
        }

        return true; // Indicate success

    } catch (error) {
        console.error("Transaction failed:", error);
        const reason = getRevertReason(error);
        toast.error(`Transaction failed: ${reason}`);
        return false; // Indicate failure
    } finally {
        setIsLoading(false);
    }
  };


  // --- Admin Functions ---
  const setSecretAndEndTime = async () => {
    if (!adminSecret || !adminEndDateTime) {
      toast.warn("Please enter both secret and end date/time.");
      return;
    }
    // Convert local datetime-local string to UNIX timestamp (seconds)
    const endTimeSec = Math.floor(new Date(adminEndDateTime).getTime() / 1000);
  
    if (endTimeSec <= Math.floor(Date.now() / 1000)) {
      toast.error("End time must be in the future.");
      return;
    }
  
    console.log(`Setting secret: "${adminSecret}", End Time (seconds): ${endTimeSec}`);
  
    const success = await executeTransaction(
        contract.setSecretAndEndTime,
        "Secret and end time set successfully!",
        adminSecret,
        endTimeSec
    );
  
    if (success) {
      // Generate QR with secret and end time in milliseconds
      const endTimeMs = endTimeSec * 1000; // Convert seconds to milliseconds
      setQrUrl(`https://tempattendance-fsd7.vercel.app/checkin?secret=${encodeURIComponent(adminSecret)}&endTime=${endTimeMs}`);
      setAdminSecret('');
      setAdminEndDateTime('');
    }
  };

  const performRevokeCheckIn = async () => {
    if (!revokeAddress || !ethers.utils.isAddress(revokeAddress)) {
      toast.warn("Please enter a valid Ethereum address to revoke.");
      return;
    }
    await executeTransaction(
        contract.revokeCheckIn,
        `Check-in revoked for ${revokeAddress.substring(0,6)}...`,
        revokeAddress
    );
     if (success) {
        setRevokeAddress('');
        await viewAttendees(); // Refresh list after revoke
     }
  };

  const performResetEvent = async () => {
    if (window.confirm("Are you sure you want to reset the event? This will clear the secret, end time, and all attendees.")) {
        const success = await executeTransaction(
            contract.resetEvent,
            "Event reset successfully!"
        );
        if (success) {
            setAttendees([]); // Clear local state too
            setAttendeesCount(0);
            setQrUrl('');
            setCurrentEndTime(null);
            setHasUserCheckedIn(null); // Reset check-in status
        }
    }
  };


  // --- User Functions ---
  const performCheckIn = async (secret) => {
    if (!secret) {
        toast.error("No secret provided for check-in.");
        return;
    }
     // Frontend check (optional, but good UX to prevent unnecessary txns)
     if (currentEndTime && Date.now() > currentEndTime.getTime()) {
        toast.error("Check-in period appears to have expired (checked on frontend).");
        // return; // You could stop here, or let the contract handle it definitively
    }
     if (hasUserCheckedIn === true) {
        toast.warn("You have already checked in.");
        return; // Prevent transaction if already checked in
     }


    await executeTransaction(
        contract.checkIn,
        "Check-in successful!",
        secret
    );
     // fetchContractData called within executeTransaction will update hasUserCheckedIn
  };

   // Check-in triggered by button click (needs secret from somewhere - maybe prompt user?)
   // For simplicity, let's assume check-in primarily happens via QR code/URL scan
   // You could add an input field for manual secret entry if needed.
   const handleManualCheckInClick = () => {
        const secret = prompt("Please enter the check-in secret:");
        if (secret) {
            performCheckIn(secret);
        }
   };


  const viewAttendees = async () => {
    if (!contract) {
        toast.error("Wallet not connected or contract not loaded.");
        return;
    }
    setIsLoading(true);
    try {
        const attendeesList = await contract.getAttendees();
        setAttendees(attendeesList);
        if (attendeesList.length === 0) {
            toast.info("No attendees have checked in yet.");
        }
    } catch (error) {
        console.error("Error fetching attendees:", error);
        toast.error("Failed to fetch attendees: " + getRevertReason(error));
    } finally {
        setIsLoading(false);
    }
  };


  // --- UI Rendering ---

  const renderEndTime = () => {
    if (!currentEndTime) return "Not Set";
    const now = new Date();
    const isExpired = now > currentEndTime;
    return (
        <>
            {currentEndTime.toLocaleString()}
            <span className={`ml-2 font-semibold ${isExpired ? 'text-red-500' : 'text-green-600'}`}>
                ({isExpired ? 'Expired' : 'Active'})
            </span>
        </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4 font-sans">
       <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

       <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-6 md:p-8 space-y-6 border border-gray-200">

         {/* Header & Connection */}
         <div className="text-center border-b pb-4 mb-6 border-gray-200">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Decentralized Attendance</h1>
            {account ? (
                <p className="text-sm text-gray-500">
                    Connected: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                    {isAdmin && <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">ADMIN</span>}
                </p>
            ) : (
                <button
                    onClick={connectWallet}
                    disabled={isLoading}
                    className="mt-2 bg-blue-600 text-white py-2 px-5 rounded-lg hover:bg-blue-700 transition duration-300 text-sm font-medium disabled:opacity-70"
                >
                    {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
            )}
             {userMessage && <p className="text-sm text-red-600 mt-2">{userMessage}</p>}
         </div>

         {/* Loading Indicator */}
         {isLoading && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
         )}


         {/* Main Content - Needs Connection */}
         {account && contract && (
            <div className="space-y-6">

                {/* General Info Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                   <h2 className="text-xl font-semibold text-gray-700 mb-3">Event Status</h2>
                   <div className="space-y-1 text-sm text-gray-600">
                       <p>Attendees Count: <span className="font-semibold text-gray-800">{attendeesCount}</span></p>
                       <p>Check-in Ends: <span className="font-semibold text-gray-800">{renderEndTime()}</span></p>
                       <p>Your Status: <span className={`font-semibold ${hasUserCheckedIn === null ? 'text-gray-500' : hasUserCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
                           {hasUserCheckedIn === null ? 'Loading...' : hasUserCheckedIn ? 'Checked In' : 'Not Checked In'}
                           </span>
                       </p>
                   </div>
                </div>

                {/* Admin Section */}
                {isAdmin && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
                        <h2 className="text-xl font-semibold text-purple-800 mb-3">Admin Panel</h2>

                        {/* Set Secret & Time */}
                        <div className="space-y-2">
                           <label className="block text-sm font-medium text-gray-700">Set New Secret</label>
                           <input
                               type="text" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)}
                               placeholder="Enter secret phrase"
                               className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                           />
                           <label className="block text-sm font-medium text-gray-700 mt-2">Set Check-in End Time</label>
                           <input
                               type="datetime-local" value={adminEndDateTime} onChange={(e) => setAdminEndDateTime(e.target.value)}
                               className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                               min={new Date().toISOString().slice(0, 16)} // Restrict to future dates
                           />
                           <button
                               onClick={setSecretAndEndTime} disabled={isLoading || !adminSecret || !adminEndDateTime}
                               className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                           >
                               Set Secret & End Time
                           </button>
                        </div>

                        {/* QR Code Display */}
                        {qrUrl && (
                            <div className="mt-4 text-center p-4 bg-white rounded border border-gray-200">
                                <h3 className="text-md font-medium text-gray-700 mb-2">Scan QR Code for Check-in</h3>
                                <QRCode value={qrUrl} size={180} level="H" className="mx-auto" />
                                <p className="text-xs text-gray-500 mt-2 break-all">URL: {qrUrl}</p>
                            </div>
                        )}

                        {/* Revoke Check-in */}
                         <div className="space-y-2 pt-4 border-t border-purple-200">
                           <label className="block text-sm font-medium text-gray-700">Revoke Check-in</label>
                           <input
                               type="text" value={revokeAddress} onChange={(e) => setRevokeAddress(e.target.value)}
                               placeholder="Enter attendee address (0x...)"
                               className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500"
                           />
                           <button
                               onClick={performRevokeCheckIn} disabled={isLoading || !revokeAddress}
                               className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                           >
                               Revoke Attendee
                           </button>
                        </div>

                        {/* Reset Event */}
                        <div className="pt-4 border-t border-purple-200">
                           <button
                               onClick={performResetEvent} disabled={isLoading}
                               className="w-full bg-yellow-500 text-black py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                           >
                               Reset Event (Clear All Data)
                           </button>
                        </div>
                    </div>
                )} {/* End Admin Section */}


                 {/* User Actions Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
                     <h2 className="text-xl font-semibold text-blue-800 mb-3">Attendee Actions</h2>
                    {/* Manual Check-in Button (if needed) */}
                    <button
                        onClick={handleManualCheckInClick}
                        disabled={isLoading || hasUserCheckedIn === true || (currentEndTime && Date.now() > currentEndTime.getTime())}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                        title={hasUserCheckedIn === true ? "You have already checked in" : (currentEndTime && Date.now() > currentEndTime.getTime()) ? "Check-in period has ended" : "Check in using the secret phrase"}
                    >
                        {hasUserCheckedIn === true ? 'Already Checked In' : 'Manual Check-in (Enter Secret)'}
                    </button>

                     {/* View Attendees */}
                     <button
                        onClick={viewAttendees} disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                     >
                         View Attendees List
                     </button>

                    {/* Attendees List Display */}
                    {attendees.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            <h3 className="text-md font-semibold text-gray-800 mb-2">Checked-in Attendees ({attendees.length})</h3>
                            <ul className="list-decimal list-inside text-gray-600 space-y-1 text-xs max-h-48 overflow-y-auto bg-white p-3 rounded border border-gray-200">
                                {attendees.map((attendee, index) => (
                                <li key={index} className="font-mono break-all">
                                    {attendee}
                                    {attendee.toLowerCase() === account.toLowerCase() && <span className="ml-2 text-purple-600 font-sans font-bold">(You)</span>}
                                </li>
                                ))}
                            </ul>
                        </div>
                    )}
                 </div> {/* End User Actions Section */}


            </div> // End Main Content
         )} {/* End Check for account and contract */}


       </div> {/* End Card */}
    </div> // End Page Container
  );
}

export default App;