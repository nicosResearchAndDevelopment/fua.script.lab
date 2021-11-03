const
    EventEmitter = require('events'),
    tls          = require('tls'),
    //
    util         = require('@nrd/fua.core.util'),
    uuid         = require("@nrd/fua.core.uuid"),
    //
    idscpVersion = "2"
;

exports.fsm = Object.freeze({
    /**
     STATE_CLOSED, which should be divided into the final state, STATE_CLOSED_LOCKED, and into the init state, STATE_CLOSED_UNLOCKED.
     STATE_WAIT_FOR_HELLO, which waits for the IDSCP_HELLO of the remote peer
     STATE_WAIT_FOR_RA, which waits for the result of the RA_PROVER and RA_VERIFIER drivers
     STATE_WAIT_FOR_RA_PROVER, which waits for the result of the RA_PROVER driver
     STATE_WAIT_FOR_RA_VERIFIER, which waits for the result of the RA_VERIFIER driver
     STATE_WAIT_FOR_DAT_AND_RA, which waits for a fresh DAT of the remote peer, as well as for the RA_PROVER driver. After a valid DAT has been received, the RA_VERIFIER will be started for re-attestation.
     STATE_WAIT_FOR_DAT_AND_RA_VERIFIER, which waits for a fresh DAT of the remote peer. After a valid DAT has been received, the RA_VERIFIER will be started for re-attestation.
     STATE_WAIT_FOR_ACK, which waits for the ACK of the previous message.
     STATE_ESTABLISHED, which allows IDSCP2-secure communication with the remote peer.
     */
    state: {
        //STATE_CLOSED:                       "STATE_CLOSED",
        STATE_CLOSED_LOCKED:                "STATE_CLOSED_LOCKED",
        STATE_CLOSED_UNLOCKED:              "STATE_CLOSED_UNLOCKED",
        STATE_WAIT_FOR_HELLO:               "STATE_WAIT_FOR_HELLO",
        STATE_WAIT_FOR_RA:                  "STATE_WAIT_FOR_RA",
        STATE_WAIT_FOR_RA_PROVER:           "STATE_WAIT_FOR_RA_PROVER",
        STATE_WAIT_FOR_RA_VERIFIER:         "STATE_WAIT_FOR_RA_VERIFIER",
        STATE_WAIT_FOR_DAT_AND_RA:          "STATE_WAIT_FOR_DAT_AND_RA",
        STATE_WAIT_FOR_DAT_AND_RA_VERIFIER: "STATE_WAIT_FOR_DAT_AND_RA_VERIFIER",
        STATE_WAIT_FOR_ACK:                 "STATE_WAIT_FOR_ACK",
        STATE_ESTABLISHED:                  "STATE_ESTABLISHED"
    },
    /**
     4 UPPER_EVENTS: Events from the User / Upper layer (e.g. ReRa, SendData)
     6 RA_EVENTS: Events from the RaVerifier- and RaProverDriver (RA_OK, RA_FAILURE, RA_MSG)
     10 SECURE_CHANNEL_EVENTS: Events from the underlying secure channel (Error, IDSCP2 messages from the remote peer)
     4 TIMEOUT_EVENTS: Events triggered by Timer Routines (Handshake Timeout, RA Driver Timeouts, DAT Timeout, Ack Timeout)
     */
    event:        {
        /**
         UPPER_START_HANDSHAKE: Start the IDSCP2 handshake for a fresh Idscp2Connection
         UPPER_CLOSE: Close the Idscp2Connection and lock the FSM forever
         UPPER_SEND_DATA: Send IDSCP_DATA (application data) to the remote peer
         UPPER_RE_RA: Repeat the RA verification of the remote peer
         */
        UPPER_START_HANDSHAKE: "UPPER_START_HANDSHAKE",
        UPPER_CLOSE:           "UPPER_CLOSE",
        UPPER_SEND_DATA:       "UPPER_SEND_DATA",
        UPPER_RE_RA:           "UPPER_RE_RA",
        /**
         RA_VERIFIER_OK: RA verification of the remote peer has succeed
         RA_VERIFIER_FAILED: RA verification of the remote peer has failed
         RA_VERIFIER_MSG: RA verifier driver has new data for the counterpart remote RA prover driver
         RA_PROVER_OK: RA prover has succeed
         RA_PROVER_FAILED: RA prover has failed
         RA_PROVER_MSG: RA prover driver has new data for the counterpart remote RA verifier driver
         */
        RA_VERIFIER_OK:     "RA_VERIFIER_OK",
        RA_VERIFIER_FAILED: "RA_VERIFIER_FAILED",
        RA_VERIFIER_MSG:    "RA_VERIFIER_MSG",
        RA_PROVER_OK:       "RA_PROVER_OK",
        RA_PROVER_FAILED:   "RA_PROVER_FAILED",
        RA_PROVER_MSG:      "RA_PROVER_MSG",
        /**
         SC_ERROR: Secure channel failed (e.g. socket IO error)
         SC_IDSCP_HELLO: Secure channel received IDSCP_HELLO from remote peer
         SC_IDSCP_CLOSE: Secure channel received IDSCP_CLOSE from remote peer
         SC_IDSCP_DAT: Secure channel received IDSCP_DAT from remote peer
         SC_IDSCP_DAT_EXPIRED: Secure channel received IDSCP_DAT_EXPIRED from remote peer
         SC_IDSCP_RA_PROVER: Secure channel received IDSCP_RA_PROVER from remote peer
         SC_IDSCP_RA_VERIFIER: Secure channel received IDSCP_RA_VERIFIER from remote peer
         SC_IDSCP_RE_RA: Secure channel received IDSCP_RE_RA from remote peer
         SC_IDSCP_DATA: Secure channel received IDSCP_DATA from remote peer
         SC_IDSCP_ACK: Secure channel received IDSCP_ACK from remote peer
         */
        SC_ERROR:             "SC_ERROR",
        SC_IDSCP_HELLO:       "SC_IDSCP_HELLO",
        SC_IDSCP_CLOSE:       "SC_IDSCP_CLOSE",
        SC_IDSCP_DAT:         "SC_IDSCP_DAT",
        SC_IDSCP_DAT_EXPIRED: "SC_IDSCP_DAT_EXPIRED",
        SC_IDSCP_RA_PROVER:   "SC_IDSCP_RA_PROVER",
        SC_IDSCP_RA_VERIFIER: "SC_IDSCP_RA_VERIFIER",
        SC_IDSCP_RE_RA:       "SC_IDSCP_RE_RA",
        SC_IDSCP_DATA:        "SC_IDSCP_DATA",
        SC_IDSCP_ACK:         "SC_IDSCP_ACK",
        /**
         Timeouts
         The following timeouts exists:
         RA Timeout: This timeout occurs when the trust interval has been expired, and a new re-attestation of the remote peer should be requests.
         DAT Timeout: This timeout occurs when the DAT of the remote peer has been expired
         Handshake Timeout: This timeout occurs when the handshake activity takes to long. It is suggested to provide own handshake timers per RA driver, such that you can restrict the time a RA driver has to prove its trust.
         Ack Timeout: This timeout occurs when no IDSCP_ACK has been received for the last sent IDSCP_DATA message. It should trigger a repetition of sending the message.
         *
         HANDSHAKE_TIMEOUT: A handshake timeout occurred. Lock the FSM forever
         DAT_TIMEOUT: A DAT timeout occurred, request a new DAT from remote peer
         RA_TIMEOUT: A RA timeout occurred, request re-attestation
         ACK_TIMEOUT: A ACK timeout occurred, send IDSCP_DATA again
         */
        HANDSHAKE_TIMEOUT: "HANDSHAKE_TIMEOUT",
        DAT_TIMEOUT:       "DAT_TIMEOUT",
        RA_TIMEOUT:        "RA_TIMEOUT",
        ACK_TIMEOUT:       "ACK_TIMEOUT"
    },
    idscpVersion: idscpVersion
});

exports.wait = (timeout, callback = () => {
}) => {
    let
        sem,
        _callback = callback
    ;
    const
        runner    = (timeout, callback) => {
            return setTimeout(() => {
                callback();
            }, (timeout * 1000))
        },
        steer     = (timeout = -1) => {
            clearTimeout(sem);
            if (timeout > 0) {
                sem = runner(timeout, _callback);
                return steer;
            } else {
                return undefined; // REM : so, deleted and out of race
            } // if ()

        } // steer
    ; // const

    sem = runner(timeout, _callback);

    return steer;

};

exports.idscpVersion = idscpVersion;

// EOF