# Project Solidity Voting

## Brief Description 

Below is a brief descritption of the project
A voting smart contract can be simple or complex, depending on the requirements of the elections you wish to support. 
The vote may be on a small number of pre-selected proposals (or candidates), or on a potentially large number of proposals suggested dynamically by the voters themselves.

In this project, you will write a voting smart contract for a small organization. 
Voters, all known to the organization, are whitelisted by their Ethereum address, can submit new proposals during a proposal registration session, and can vote on proposals during the voting session.

✔️ The vote is not secret

✔️ Each voter can see the votes of others

✔️ The winner is determined by simple majority

✔️ The proposal that gets the most votes wins.## Install _OpenZeppelin_ with _NPM_


👉 The voting process:

Here's how the entire voting process unfolds:

1) The voting administrator registers a whitelist of voters identified by their Ethereum address.
2) The voting administrator starts the recording session of the proposal.
3) Registered voters are allowed to register their proposals while the registration session is active.
4) The voting administrator terminates the proposal recording session.
5) The voting administrator starts the voting session.
6) Registered voters vote for their preferred proposal.
7) The voting administrator ends the voting session.
8) The voting administrator counts the votes.
9) Everyone can check the final details of the winning proposal.


## Unit Tests

For unit tests, we are using the Truffle Framework and Ganache to mount a local blockchain.<br>
We used [CHAI](https://www.chaijs.com/) as the main framework for unit testsin JS.<br>
We uses the [TestHelper](https://docs.openzeppelin.com/test-helpers/0.5/) library from [OpenZeppelin](https://docs.openzeppelin.com/) as well

Below the description of our tests

### 1) TEST OF THE NATURAL WORKFLOW STATUS
The natural workflow begins with an initial status.<br>
And a specific status must follow.
There must be a required order for actions.
That's what we tested.
The initial process is 'RegisteringVoters'
We checked that in case of succes, the event _WorkflowStatusChange_ is emitted
### 2) TEST OF THE UNNATURAL WORKFLOW STATUS
Secondly, we tested an unnatural order of workflowstatus.
For instance, If the current status at index 2
we tested that the action reverts if it don't match the following status of the current status.
So if we want to execute the action matching the status 4 while the current status is 2, 
we wanted to check that it reverts.

### 3) TEST OF "GETTER" FONCTION
✔️ Should see that the _getVoter_ is only available for voters registered <br>
✔️ Should see a revert message when a voter that is not the owner add a voter<br>


### 4) TEST OF "ADD VOTERS" PROCESS

✔️ Should see an event emitted : _VoterRegistered_ <br>
✔️ Should see a revert message when a voter that is not the owner add a voter<br>
✔️ Owner should be able to add voter<br>
✔️ should see the workflow status unchanged after adding a voter<br>
✔️ Should not be possible to register a duplicate voter (We test that a voter mus be unique) <br>
✔️ Should see that a voter newly created is registered <br>
✔️ Should see that a voter newly created has not voted yet <br>
✔️ Should see that a voter newly created can not vote until the end of the recording voters session <br>
✔️ Should see that a voter newly created can not give a proposal until the end of the recording voters session <br>



### 5) TEST OF "ADD PROPOSALS" PROCESS
✔️ Should see an event emitted : _ProposalRegistered_ <br>
✔️ Should see a revert when a not registered voter submit a proposal<br>
✔️ Should see that a proposal must not be empty. So it's mandatory<br>
✔️ Should expect a value for desc of proposal struct <br>
✔️ Should expect a new value in the array of proposals <br>
✔️ Should see the right workflow status after adding a proposal <br>
✔️ Should see that a voter is able to give many proposals <br>
✔️ Should see that a new proposal should have a vote count equals to 0 <br>
✔️ Should not see the voter vote for the proposal he gave due to bad workflowstatus <br>
> For this test we check that during this process a voter can not vote before the vote session is ended by the owner  <br>

✔️ Should see the workflow status unchanged after adding a proposal ==> So we check that after adding a proposal the workflowstatus is still _ProposalsRegistrationStarted_<br>



### 6) TEST OF THE "VOTE" PROCESS
✔️ Should see an event emitted : _Voted_ <br>
✔️ Should see that a not registered voter can not vote <br>
✔️ Should see that a registered voter can not vote for a proposal that doesn't exist <br>
✔️ Should see that a proposalId voted by a voter appears in the struct of the voter <br>
✔️ Should see that the property hasVoted of the struct voter is hydrated after the vote <br>
✔️ Should see that a voter can not vote twice <br>
✔️ Should see that the voteCount property of the proposal struct is incremented after the vote <br>
✔️ Should see the workflow status unchanged after voting <br>
✔️ Should see the owner can not tally votes before ending vote session <br>

### 7) TEST OF THE "TALLIED VOTE" PROCESS
✔️ Should see an event emitted : _WorkflowStatusChange_ to value _VotesTallied_ <br>
✔️ Should see a not owner voter can not vote <br>
✔️ Should see the owner can vote without error <br>
✔️ Should see the winningProposalID state property is not null anymore <br>
✔️ Should see the winningProposalID match the winner <br>
> For this test we hydrate a set of data voters, porposals ans votes. 
Then we are able to compute our winner in Javascript.
We compare this computed winner with the winner computed with the smart contract
and compare with the winnerID <br>

## RUN TESTS

Simply execute the 2 commands : 

```
ganache-cli
```

then : 

```
truffle test
```