"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import QRCode from "qrcode.react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  QrCode,
  Shield,
  Copy,
  ExternalLink,
  Settings,
  Check,
} from "lucide-react"

// Contract details
const contractAddress = "0x84aE0eDF89DDBDa29d9d555A459a324ceB72704d"
const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newAdmin",
        type: "address",
      },
    ],
    name: "changeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_secret",
        type: "string",
      },
    ],
    name: "checkIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "attendee",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CheckIn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "attendee",
        type: "address",
      },
    ],
    name: "CheckInRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "EventReset",
    type: "event",
  },
  {
    inputs: [],
    name: "resetEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_attendee",
        type: "address",
      },
    ],
    name: "revokeCheckIn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "newSecretHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newEndTime",
        type: "uint256",
      },
    ],
    name: "SecretAndEndTimeUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_secret",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_endTime",
        type: "uint256",
      },
    ],
    name: "setSecretAndEndTime",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "attendees",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "checkInEndTime",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAttendees",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAttendeesCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCheckInEndTime",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_attendee",
        type: "address",
      },
    ],
    name: "hasAttendeeCheckedIn",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "hasCheckedIn",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "secretHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

// Helper function to parse errors
function getRevertReason(error) {
  let reason = error.message
  if (error.error && error.error.message) {
    reason = error.error.message
  } else if (error.data && error.data.message) {
    reason = error.data.message
  } else if (error.reason) {
    reason = error.reason
  }

  const revertPrefix = "execution reverted: "
  if (reason.includes(revertPrefix)) {
    reason = reason.substring(reason.indexOf(revertPrefix) + revertPrefix.length)
  }
  return reason.split("'")[0].split('"')[0].trim() || "Transaction failed. Check console for details."
}

export default function AttendanceDapp() {
  // State variables
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [account, setAccount] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userMessage, setUserMessage] = useState("")

  // Admin state
  const [adminSecret, setAdminSecret] = useState("")
  const [adminEndDateTime, setAdminEndDateTime] = useState("")
  const [qrUrl, setQrUrl] = useState("")
  const [revokeAddress, setRevokeAddress] = useState("")

  // Attendee state
  const [attendeesCount, setAttendeesCount] = useState(0)
  const [attendees, setAttendees] = useState([])
  const [currentEndTime, setCurrentEndTime] = useState(null)
  const [hasUserCheckedIn, setHasUserCheckedIn] = useState(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showAttendees, setShowAttendees] = useState(false)

  // Initialize connection and check URL on load
  useEffect(() => {
    const initialize = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
        setProvider(web3Provider)

        // Try to connect if already permitted
        const accounts = await web3Provider.listAccounts()
        if (accounts.length > 0) {
          await connectWallet()
        } else {
          setUserMessage("Please connect your wallet to continue.")
        }
      } else {
        toast.error("Please install MetaMask or another web3 wallet to use this application.")
        setUserMessage("MetaMask or another web3 wallet is required.")
      }
    }
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch data when contract is available
  const fetchContractData = useCallback(async (currentContract, userAddress) => {
    if (!currentContract || !userAddress) return
    setIsLoading(true)
    try {
      const [adminAddr, count, endTimeSeconds, checkedInStatus] = await Promise.all([
        currentContract.admin(),
        currentContract.getAttendeesCount(),
        currentContract.getCheckInEndTime(),
        currentContract.hasAttendeeCheckedIn(userAddress),
      ])

      setIsAdmin(userAddress.toLowerCase() === adminAddr.toLowerCase())
      setAttendeesCount(count.toNumber())
      setCurrentEndTime(endTimeSeconds.toNumber() > 0 ? new Date(endTimeSeconds.toNumber() * 1000) : null)
      setHasUserCheckedIn(checkedInStatus)
    } catch (error) {
      console.error("Error fetching contract data:", error)
      toast.error("Could not load contract data. Please check your network connection.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Re-fetch data when account changes
  useEffect(() => {
    if (contract && account) {
      fetchContractData(contract, account)
    }
  }, [account, contract, fetchContractData])

  // Handle check-in from URL parameters
  useEffect(() => {
    const handleCheckInFromUrl = async () => {
      if (!contract || !signer || !account) return

      const searchParams = new URLSearchParams(window.location.search)
      const secretFromUrl = searchParams.get("secret")

      if (window.location.pathname === "/checkin" && secretFromUrl) {
        // Clear URL parameters to avoid re-triggering
        window.history.replaceState({}, document.title, window.location.pathname.replace("/checkin", "/"))
        await performCheckIn(secretFromUrl)
      }
    }

    handleCheckInFromUrl()
  }, [contract, signer, account])

  // Wallet connection
  const connectWallet = async () => {
    if (!provider) {
      toast.error("Web3 provider not found. Please install MetaMask.")
      return
    }
    setIsLoading(true)
    setUserMessage("Connecting to your wallet...")
    try {
      await provider.send("eth_requestAccounts", [])
      const currentSigner = provider.getSigner()
      const currentAddress = await currentSigner.getAddress()
      const currentContract = new ethers.Contract(contractAddress, contractABI, currentSigner)

      setSigner(currentSigner)
      setAccount(currentAddress)
      setContract(currentContract)
      setUserMessage("")

      toast.success(
        `Wallet connected: ${currentAddress.substring(0, 6)}...${currentAddress.substring(currentAddress.length - 4)}`,
      )

      // Fetch data after connecting
      await fetchContractData(currentContract, currentAddress)
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast.error("Failed to connect wallet. Please check your wallet connection.")
      setUserMessage("Wallet connection failed.")
      setAccount("")
      setSigner(null)
      setContract(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Execute transaction with error handling
  const executeTransaction = async (txFunction, successMessage, ...args) => {
    if (!contract || !signer) {
      toast.error("Wallet not connected or contract not loaded.")
      return false
    }
    setIsLoading(true)
    try {
      const tx = await txFunction(...args)
      toast.info(`Transaction submitted. Waiting for confirmation...`, {
        autoClose: 5000,
      })

      const receipt = await tx.wait()
      toast.success(`${successMessage}`)

      // Refresh data after successful transaction
      await fetchContractData(contract, account)
      if (successMessage.includes("Attendees")) {
        await viewAttendees()
      }

      return true
    } catch (error) {
      console.error("Transaction failed:", error)
      const reason = getRevertReason(error)
      toast.error(`Transaction failed: ${reason}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Admin Functions
  const setSecretAndEndTime = async () => {
    if (!adminSecret || !adminEndDateTime) {
      toast.warn("Please enter both secret and end date/time.")
      return
    }

    // Convert datetime-local to UNIX timestamp (seconds)
    const endTimeSec = Math.floor(new Date(adminEndDateTime).getTime() / 1000)

    if (endTimeSec <= Math.floor(Date.now() / 1000)) {
      toast.error("End time must be in the future.")
      return
    }

    const success = await executeTransaction(
      contract.setSecretAndEndTime,
      "Secret and end time set successfully!",
      adminSecret,
      endTimeSec,
    )

    if (success) {
      // Generate QR code URL
      const endTimeMs = endTimeSec * 1000
      setQrUrl(
        `https://tempattendance-fsd7.vercel.app/checkin?secret=${encodeURIComponent(adminSecret)}&endTime=${endTimeMs}`,
      )
      setAdminSecret("")
      setAdminEndDateTime("")
    }
  }

  const performRevokeCheckIn = async () => {
    if (!revokeAddress || !ethers.utils.isAddress(revokeAddress)) {
      toast.warn("Please enter a valid Ethereum address to revoke.")
      return
    }
    const success = await executeTransaction(
      contract.revokeCheckIn,
      `Check-in revoked for ${revokeAddress.substring(0, 6)}...`,
      revokeAddress,
    )
    if (success) {
      setRevokeAddress("")
      await viewAttendees()
    }
  }

  const performResetEvent = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the event? This will clear the secret, end time, and all attendees.",
      )
    ) {
      const success = await executeTransaction(contract.resetEvent, "Event reset successfully!")
      if (success) {
        setAttendees([])
        setAttendeesCount(0)
        setQrUrl("")
        setCurrentEndTime(null)
        setHasUserCheckedIn(null)
      }
    }
  }

  // User Functions
  const performCheckIn = async (secret) => {
    if (!secret) {
      toast.error("No secret provided for check-in.")
      return
    }

    if (currentEndTime && Date.now() > currentEndTime.getTime()) {
      toast.error("Check-in period has expired.")
      return
    }

    if (hasUserCheckedIn === true) {
      toast.warn("You have already checked in.")
      return
    }

    await executeTransaction(contract.checkIn, "Check-in successful!", secret)
  }

  const handleManualCheckInClick = () => {
    const secret = prompt("Please enter the check-in secret:")
    if (secret) {
      performCheckIn(secret)
    }
  }

  const viewAttendees = async () => {
    if (!contract) {
      toast.error("Wallet not connected or contract not loaded.")
      return
    }
    setIsLoading(true)
    try {
      const attendeesList = await contract.getAttendees()
      setAttendees(attendeesList)
      setShowAttendees(true)
      if (attendeesList.length === 0) {
        toast.info("No attendees have checked in yet.")
      }
    } catch (error) {
      console.error("Error fetching attendees:", error)
      toast.error("Failed to fetch attendees: " + getRevertReason(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Copy QR URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl).then(
      () => {
        setCopySuccess(true)
        toast.success("QR URL copied to clipboard!")
        setTimeout(() => setCopySuccess(false), 2000)
      },
      () => {
        toast.error("Failed to copy URL")
      },
    )
  }

  // UI Helper Functions
  const renderEndTime = () => {
    if (!currentEndTime) return "Not Set"
    const now = new Date()
    const isExpired = now > currentEndTime
    return (
      <div className="flex items-center">
        <span>{currentEndTime.toLocaleString()}</span>
        <span
          className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${isExpired ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"}`}
        >
          {isExpired ? "Expired" : "Active"}
        </span>
      </div>
    )
  }

  const renderStatusBadge = () => {
    if (hasUserCheckedIn === null)
      return (
        <div className="flex items-center gap-1.5 text-purple-300 animate-pulse">
          <Clock className="w-5 h-5" />
          <span>Loading status...</span>
        </div>
      )

    return hasUserCheckedIn ? (
      <div className="flex items-center gap-1.5 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span>Checked In</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 text-amber-400">
        <XCircle className="w-5 h-5" />
        <span>Not Checked In</span>
      </div>
    )
  }

  // Truncate Ethereum address for display
  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className="min-h-screen w-full bg-[#0f0b1e] text-purple-100 flex flex-col items-center">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1530] p-6 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-purple-300/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <p className="text-purple-200 font-medium">Processing Transaction...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-5xl pt-12 pb-6 px-4 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-full"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">Offline Attendance DApp</h1>
        <p className="text-purple-300/70 max-w-2xl mx-auto">Blockchain-powered event check-in system</p>
      </div>

      {/* Connection Status */}
      <div className="w-full max-w-5xl flex flex-col items-center mb-8 px-4">
        {account ? (
          <div className="flex flex-col items-center gap-2">
            <button className="px-6 py-2 bg-green-600/90 text-white rounded-full font-medium text-sm hover:bg-green-700/90 transition-all shadow-md flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Connected: {truncateAddress(account)}</span>
            </button>
            {isAdmin && (
              <div className="px-4 py-1 bg-purple-900/50 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Admin Access Granted
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600/80 text-white rounded-full font-medium text-sm hover:bg-purple-700/80 transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        )}

        {userMessage && (
          <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700/30 rounded-lg text-amber-300 text-center text-sm">
            {userMessage}
          </div>
        )}
      </div>

      {/* Main Content */}
      {!account ? (
        <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-24 h-24 bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-purple-300 mb-2">Welcome to Blockchain Attendance</h2>
          <p className="text-purple-300/70 mb-8 max-w-md mx-auto text-center">
            Connect your wallet to check in to events or manage attendance as an admin.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-5xl flex-1 flex flex-col px-4 pb-12 space-y-8">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="w-full bg-[#1a1530] rounded-xl border border-purple-900/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-purple-900/50 flex items-center">
                <Settings className="w-5 h-5 text-purple-400 mr-2" />
                <h2 className="text-xl font-bold text-purple-300">Admin Controls</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Generate QR Code */}
                <div className="bg-[#211a3b] p-5 rounded-lg border border-purple-900/50">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">Generate Check-in QR Code</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300/70 mb-1">Secret Phrase</label>
                      <input
                        type="text"
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        placeholder="Enter secret phrase for check-in"
                        className="w-full p-3 bg-[#0f0b1e] border border-purple-900/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-purple-100 placeholder-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-300/70 mb-1">Check-in End Time</label>
                      <input
                        type="datetime-local"
                        value={adminEndDateTime}
                        onChange={(e) => setAdminEndDateTime(e.target.value)}
                        className="w-full p-3 bg-[#0f0b1e] border border-purple-900/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-purple-100"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={setSecretAndEndTime}
                        disabled={isLoading || !adminSecret || !adminEndDateTime}
                        className="flex-1 bg-purple-600/80 text-white py-3 px-4 rounded-lg hover:bg-purple-700/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Generate QR
                      </button>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {qrUrl && (
                    <div className="mt-6 p-5 bg-[#0f0b1e] rounded-lg border border-purple-900/50 flex flex-col items-center">
                      <h4 className="text-md font-semibold text-purple-300 mb-4 flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-purple-400" />
                        Check-in QR Code
                      </h4>
                      <div className="bg-white p-4 rounded-lg">
                        <QRCode value={qrUrl} size={180} level="H" className="mx-auto" />
                      </div>
                      <div className="flex flex-col items-center gap-2 mt-4 w-full">
                        <p className="text-xs text-purple-300/70 break-all max-w-md text-center">{qrUrl}</p>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-900/30 rounded-full hover:bg-purple-800/30 transition-colors"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copySuccess ? "Copied!" : "Copy URL"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Revoke Check-in */}
                <div className="bg-[#211a3b] p-5 rounded-lg border border-purple-900/50">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">Revoke Attendee Check-in</h3>
                  <input
                    type="text"
                    value={revokeAddress}
                    onChange={(e) => setRevokeAddress(e.target.value)}
                    placeholder="Enter attendee address (0x...)"
                    className="w-full p-3 bg-[#0f0b1e] border border-purple-900/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-purple-100 placeholder-purple-500/50 mb-3"
                  />
                  <button
                    onClick={performRevokeCheckIn}
                    disabled={isLoading || !revokeAddress}
                    className="w-full bg-red-600/70 text-white py-3 px-4 rounded-lg hover:bg-red-700/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  >
                    Revoke Attendee
                  </button>
                </div>

                {/* Reset Event */}
                <div className="bg-[#211a3b] p-5 rounded-lg border border-purple-900/50">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">Reset Event</h3>
                  <p className="text-sm text-purple-300/70 mb-4">
                    This will clear all attendees and reset the event. You'll need to set a new secret afterward.
                  </p>
                  <button
                    onClick={performResetEvent}
                    disabled={isLoading}
                    className="w-full bg-amber-600/70 text-white py-3 px-4 rounded-lg hover:bg-amber-700/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Event
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleManualCheckInClick}
              disabled={
                isLoading || hasUserCheckedIn === true || (currentEndTime && Date.now() > currentEndTime.getTime())
              }
              className="px-6 py-3 bg-purple-600/80 text-white rounded-lg hover:bg-purple-700/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              title={
                hasUserCheckedIn === true
                  ? "You have already checked in"
                  : currentEndTime && Date.now() > currentEndTime.getTime()
                    ? "Check-in period has ended"
                    : "Check in using the secret phrase"
              }
            >
              <CheckCircle className="w-5 h-5" />
              {hasUserCheckedIn === true ? "Already Checked In" : "Check In"}
            </button>

            <button
              onClick={viewAttendees}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600/80 text-white rounded-lg hover:bg-blue-700/80 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              View Attendees
            </button>
          </div>

          {/* Attendees List */}
          {showAttendees && (
            <div className="w-full bg-[#1a1530] rounded-xl border border-purple-900/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-purple-900/50 flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-purple-400 mr-2" />
                  <h2 className="text-xl font-bold text-purple-300">Attendees</h2>
                </div>
                <div className="text-sm text-purple-300/70">Total: {attendeesCount}</div>
              </div>

              <div className="p-6">
                {attendees.length > 0 ? (
                  <div className="bg-[#0f0b1e] rounded-lg border border-purple-900/50 overflow-hidden">
                    <div className="border-b border-purple-900/50 py-2 px-4 bg-[#211a3b] text-xs text-purple-300/70">
                      attendees-list.eth
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-[#211a3b]">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-purple-300">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-purple-300">Address</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-purple-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-900/30">
                          {attendees.map((attendee, index) => (
                            <tr key={index} className="hover:bg-purple-900/10">
                              <td className="px-3 py-2 text-sm text-purple-300/70">{index + 1}</td>
                              <td className="px-3 py-2 font-mono text-xs break-all text-purple-300">
                                <div className="flex items-center">
                                  {attendee}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(attendee)
                                      toast.success("Address copied to clipboard")
                                    }}
                                    className="ml-2 text-purple-400/50 hover:text-purple-400"
                                    title="Copy address"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {attendee.toLowerCase() === account.toLowerCase() ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-500/30">
                                    You
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
                                    Attendee
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f0b1e] rounded-lg border border-purple-900/50 p-12 flex flex-col items-center justify-center">
                    <div className="border-b border-purple-900/50 py-2 px-4 bg-[#211a3b] text-xs text-purple-300/70 absolute top-0 left-0 right-0">
                      attendees-list.eth
                    </div>
                    <div className="text-center py-8">
                      <p className="text-purple-300/70">No attendees have checked in yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Event Status */}
          <div className="w-full bg-[#1a1530] rounded-xl border border-purple-900/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-900/50 flex items-center">
              <Clock className="w-5 h-5 text-purple-400 mr-2" />
              <h2 className="text-xl font-bold text-purple-300">Event Status</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#211a3b] p-4 rounded-lg border border-purple-900/50">
                  <div className="text-sm text-purple-300/70 mb-1">Attendees</div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span className="text-2xl font-bold text-purple-200">{attendeesCount}</span>
                  </div>
                </div>

                <div className="bg-[#211a3b] p-4 rounded-lg border border-purple-900/50">
                  <div className="text-sm text-purple-300/70 mb-1">Check-in Ends</div>
                  <div className="text-purple-200 font-medium">{renderEndTime()}</div>
                </div>

                <div className="bg-[#211a3b] p-4 rounded-lg border border-purple-900/50">
                  <div className="text-sm text-purple-300/70 mb-1">Your Status</div>
                  <div className="font-medium">{renderStatusBadge()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="w-full bg-[#0a071a] border-t border-purple-900/30 p-4 text-center text-sm text-purple-300/50">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-purple-400/50" />
          <span>Decentralized Attendance System powered by Ethereum</span>
          <a
            href={`https://etherscan.io/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-purple-400/70 hover:text-purple-400 ml-1"
          >
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
