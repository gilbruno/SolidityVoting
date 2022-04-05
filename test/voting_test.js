const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Voting = artifacts.require('Voting');


contract('Voting', accounts => {
    
    const owner      = accounts[0];
    const voter1     = accounts[1];
    const voter2     = accounts[2];
    const voter3     = accounts[3];
    const voter4     = accounts[4];
    const voter5     = accounts[5];
    const voter6     = accounts[6];
    const voter7     = accounts[7];
    const voter8     = accounts[8];
    const voter9     = accounts[9];
    const voter10    = accounts[10];

    const PROPOSAL_1  = "P1";
    const PROPOSAL_2  = "P2";
    const PROPOSAL_3  = "P3";
    const PROPOSAL_4  = "P4";
    const PROPOSAL_5  = "P5";
    const PROPOSAL_6  = "P6";
    const PROPOSAL_7  = "P7";
    const PROPOSAL_8  = "P8";
    const PROPOSAL_9  = "P9";
    const PROPOSAL_10 = "P10";

    const ZERO   = new BN(0);
    const ONE    = new BN(1);
    const TWO    = new BN(2);
    const THREE  = new BN(3);
    const FOUR   = new BN(4);
    const FIVE   = new BN(5);

    const NOT_REGISTERED_ADDR = '0x0A098Eda01Ce92ff4A4CCb7A4fFFb5A43EBC70DC';
    let votingInstance;
    let winnerProposalId;
    let proposals = [];

    //Helpers functions to have a set of data of voters, proposals & votes for unit tests
    async function addVoters (votersCount) {
        votingInstance = await Voting.new({from:owner});
        for (let i=0; i<votersCount;i++) {
            await votingInstance.addVoter(accounts[i], {from: owner});
        }
        return votingInstance;
    };

    async function addProposals(votingInstance, proposals, _voter) {
        for (let i=0; i<proposals.length;i++) {
            await votingInstance.addProposal(proposals[i], {from: _voter});
        } 
    };

    async function setVotes(votingInstance, proposals) {
        await votingInstance.setVote(ZERO, {from: voter1});
        await votingInstance.setVote(ZERO, {from: voter2});
        proposals[0] = 2;
        await votingInstance.setVote(ONE, {from: voter3});
        proposals[1] = 1;
        await votingInstance.setVote(TWO, {from: voter4});
        proposals[2] = 1;
    }

    describe("TEST STATE MACHINE", function () {
        before(async function () {
            votingInstance = await Voting.new({from:owner});
            let workflowStatus = await votingInstance.workflowStatus.call({from: owner});
        });

        const REGISTERING_VOTERS             = 'RegisteringVoters';
        const PROPOSALS_REGISTRATION_STARTED = 'ProposalsRegistrationStarted';
        const PROPOSALS_REGISTRATION_ENDED   = 'ProposalsRegistrationEnded';
        const VOTING_SESSION_STARTED         = 'VotingSessionStarted';
        const VOTING_SESSION_ENDED           = 'VotingSessionEnded';
        const VOTES_TALLIED                  = 'VotesTallied';

        const workflowStatusName = [
            REGISTERING_VOTERS,
            PROPOSALS_REGISTRATION_STARTED, 
            PROPOSALS_REGISTRATION_ENDED,
            VOTING_SESSION_STARTED,
            VOTING_SESSION_ENDED,
            VOTES_TALLIED
        ];

        const from_owner = {from: owner};
        var workflowStatus = [
            {
                name: REGISTERING_VOTERS
            },
            {
                name: PROPOSALS_REGISTRATION_STARTED,
                fn: function (){return votingInstance.startProposalsRegistering(from_owner)},
                fName: "startProposalsRegistering",
                msgRevert:' Registering proposals cant be started now',
            },
            {
                name: PROPOSALS_REGISTRATION_ENDED,
                fn: function (){return votingInstance.endProposalsRegistering(from_owner)},
                fName: "endProposalsRegistering",
                msgRevert: 'Registering proposals havent started yet',
            },
            {
                name: VOTING_SESSION_STARTED,
                fn: function (){return votingInstance.startVotingSession(from_owner)},
                fName: "startVotingSession",
                msgRevert: 'Registering proposals phase is not finished',
            },
            {
                name: VOTING_SESSION_ENDED,
                fn: function (){return votingInstance.endVotingSession(from_owner)},
                fName: "endVotingSession",
                msgRevert: 'Voting session havent started yet',
            },
            {
                name: VOTES_TALLIED,
                fn: function (){return votingInstance.tallyVotes(from_owner)},
                fName: "tallyVotes",
                msgRevert: "Current status is not voting session ended",
            }
        ];
        
        context("--> Test a natural workflow from the initial status 'RegisteringVoters' ", function () {
            before(async function () {
                votingInstance = await Voting.new({from:owner});
                //let workflowStatus = await votingInstance.workflowStatus.call({from: owner});
            }); 
            
            it('Everybody should see the workflowStatus', async function () { 
                let workflowStatus = await votingInstance.workflowStatus.call({from: NOT_REGISTERED_ADDR});
                expect(new BN(workflowStatus)).to.be.bignumber.equal(ZERO);
            });
    
            for(let i=1; i <workflowStatus.length;i++) {
                it('should see an event emitted "WorkflowStatusChange" when ' + workflowStatus[i].fName, async function () {
                    const findEvent = await workflowStatus[i].fn();
                    expectEvent(findEvent, 'WorkflowStatusChange', {previousStatus: new BN(i-1), newStatus:new BN(i)});      
                });
            }
       });

       context("--> Test an unnatural workflow ", function () {
            const testUnnaturalWorkflow = function () {
                let currentStatus = initialStatus;
                before(async function () {
                    votingInstance = await Voting.new({from:owner});
                    if (currentStatus != 0) {
                        for (let i=1; i<=currentStatus; i++) {
                            await workflowStatus[i].fn();    
                        }
                    }
                });
                for(let i=1; i<workflowStatus.length; i++) {
                    if (i != initialStatus+1) {
                        it('Should see a revert for current status '+workflowStatusName[initialStatus]+ ' when ' + workflowStatus[i].fName +' is executed --> Error Message: "'+workflowStatus[i].msgRevert+'"', 
                            async function () {
                                await (expectRevert(workflowStatus[i].fn(), workflowStatus[i].msgRevert));
                            }
                        )
                    }
                }    
            };

            //Loop through all the statuses
            let initialStatus = 0;
            for (let status=0; initialStatus < workflowStatusName.length-1; status++) {
                initialStatus = status;
                context((status+1)+" - Current Status : "+workflowStatusName[status], testUnnaturalWorkflow);    
            }
        });
    });


    describe('TEST GETTER', function () {
        before(async function () {
            votingInstance = await Voting.new({from:owner});
        });

        it('Should see that the getVoter is only available for voters registered', async function () { 
            await expectRevert(votingInstance.getVoter(voter1, {from: NOT_REGISTERED_ADDR}), "You're not a voter");
        });

        it('Should see that the getOneProposal is only available for voters registered', async function () { 
            await expectRevert(votingInstance.getOneProposal(ZERO, {from: NOT_REGISTERED_ADDR}), "You're not a voter");
        });

    });
        

    describe('TEST ADD VOTER', function () {
        async function addVoters(voters) {
            for(const voter of voters) {
                await votingInstance.addVoter(voter, {from: owner});
            }
        }

        beforeEach(async function () {
            votingInstance = await Voting.new({from:owner});
        });
        
        it('Should see an event emitted : "VoterRegistered" ', async function () { 
            const findEvent = await votingInstance.addVoter(owner, {from: owner});
            expectEvent(findEvent, 'VoterRegistered', {voterAddress: owner});      
        });

        it('Should see a revert message when a voter that is not the owner add a voter', async function () { 
          await (expectRevert(votingInstance.addVoter(voter2, {from: voter1}), "Ownable: caller is not the owner"));
        });
        
        it('Owner should be able to add voter ', async function () { 
            await addVoters([owner, voter1]);
            let voterAdded = await votingInstance.getVoter(voter1, {from: owner});
            expect(voterAdded.isRegistered).to.be.true;      
        });

        it('Should see the workflow status unchanged after adding a voter', async function () {
            await addVoters([owner]);
            let workflowStatus = await votingInstance.workflowStatus.call({from: owner});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(ZERO);
        });

        it('Should not be possible to register a duplicate voter', async function () { 
            await addVoters([voter1]);
            await (expectRevert(votingInstance.addVoter(voter1, {from: owner}), "Already registered"));
        });

        it('Should see that a voter newly created is registered', async function () { 
            await addVoters([owner, voter1]);
            let voterAdded = await votingInstance.getVoter(voter1, {from: owner});
            expect(voterAdded.isRegistered).to.be.true;
        });

        it('Should see that a voter newly created has not voted yet', async function () { 
            await addVoters([owner, voter2]);
            let voterAdded = await votingInstance.getVoter(voter2, {from: owner});
            expect(voterAdded.hasVoted).to.be.false;
        });

        it('Should see that a voter newly created has no proposalId yet', async function () { 
            await addVoters([owner, voter2]);
            let voterAdded = await votingInstance.getVoter(voter2, {from: owner});
            expect(new BN(voterAdded.proposalId)).to.be.bignumber.equal(ZERO);
        });

        it('Should see that a voter newly created can not vote until the end of the recording voters session', async function () { 
            await addVoters([owner, voter2]);
            await (expectRevert(votingInstance.setVote(ZERO, {from: voter2}), "Voting session havent started yet"));
        });

        it('Should see that a voter newly created can not give a proposal until the end of the recording voters session', async function () { 
            await addVoters([owner, voter2]);
            await (expectRevert(votingInstance.addProposal(PROPOSAL_1, {from: voter2}), "Proposals are not allowed yet"));
        });

        it('Everybody should see the workflowStatus at this stage', async function () { 
            let workflowStatus = await votingInstance.workflowStatus.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(ZERO);
        });

        it('Everybody should see the winningProposalID at this stage with value 0', async function () { 
            const winningProposalId = await votingInstance.winningProposalID.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(winnerProposalId)).to.be.bignumber.equal(ZERO);
        });

      });

    describe('TEST ADD PROPOSAL', function () {
        /**
        * To test adding proposals, some conditions are required : 
        *   - Have some voters in the whitelist (we added 3 voters in the whitelist)
        *   - The Workflow Status must be at index= 1 i.e "ProposalRegistrationStarded"
        */
        beforeEach(async function () {
            votingInstance = await addVoters(3);
            await votingInstance.startProposalsRegistering();
        });
        
        it('Should see an event emitted : ProposalRegistered', async function () {
            const findEvent =  await votingInstance.addProposal(PROPOSAL_2, {from: voter1});
            expectEvent(findEvent, 'ProposalRegistered', {proposalId: ZERO});
        });

        it('Should see a revert when a not registered voter submit a proposal', async function () { 
            await expectRevert(votingInstance.addProposal(PROPOSAL_2, {from: voter4}), "You're not a voter");
        });        

        it('Should see that a proposal must not be empty', async function () { 
            await (expectRevert(votingInstance.addProposal("", {from: voter1}), "Vous ne pouvez pas ne rien proposer"));
        });

        it('Should expect a value for desc of proposal struct', async function () { 
            await votingInstance.addProposal(PROPOSAL_1, {from: voter1});
            let proposal = await votingInstance.getOneProposal(ZERO, {from: voter1});
            expect(proposal.description).to.equal(PROPOSAL_1);
        });
        
        it('Should expect a new value in the array of proposals', async function () {
            await addProposals(votingInstance, [PROPOSAL_1, PROPOSAL_2], voter1);
            let proposal2 = await votingInstance.getOneProposal(ONE, {from: voter1});
            expect(proposal2.description).to.be.equal(PROPOSAL_2);
        });

        it('Should see the right workflow status after adding a proposal', async function () {
            await votingInstance.addProposal(PROPOSAL_2, {from: voter1});
            let workflowStatus = await votingInstance.workflowStatus.call({from: owner});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(ONE);
        });

        it('Should see that a voter is able to give many proposals', async function () {
            await addProposals(votingInstance, [PROPOSAL_1, PROPOSAL_2, PROPOSAL_3], voter1);
            let proposal1 = await votingInstance.getOneProposal(ZERO, {from: voter1});
            let proposal2 = await votingInstance.getOneProposal(ONE, {from: voter1});
            let proposal3 = await votingInstance.getOneProposal(TWO, {from: voter1});
            expect(proposal1.description+proposal2.description+proposal3.description).to.be.equal(PROPOSAL_1+PROPOSAL_2+PROPOSAL_3);
        });

        it('A new proposal should have a vote count equals to 0', async function () {
            await votingInstance.addProposal(PROPOSAL_1, {from: voter1});
            let proposal = await votingInstance.getOneProposal(ZERO, {from: voter1});
            expect(new BN(proposal.voteCount)).to.be.bignumber.equal(ZERO);
        });

        it('Should not see the voter vote for the proposal he gave due to bad workflowstatus', async function () {
            await votingInstance.addProposal(PROPOSAL_1, {from: voter1});
            await (expectRevert(votingInstance.setVote(ZERO, {from: voter1}), "Voting session havent started yet"));
        });

        it('Should see the workflow status unchanged after adding a proposal', async function () {
            await votingInstance.addProposal(PROPOSAL_1, {from: voter1});
            let workflowStatus = await votingInstance.workflowStatus.call({from: owner});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(ONE);
        });

        it('Everybody should see the workflowStatus at this stage', async function () { 
            let workflowStatus = await votingInstance.workflowStatus.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(ONE);
        });

        it('Everybody should see the winningProposalID at this stage with value 0', async function () { 
            const winningProposalId = await votingInstance.winningProposalID.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(winnerProposalId)).to.be.bignumber.equal(ZERO);
        });

    });  

    describe('TEST VOTE', function () {
        /**
        * To test vote process, some conditions are required : 
        *   - Have some voters in the whitelist (we added 3 voters in the whitelist)
        *   - Have some proposals in the proposalsliost (we added 5 proposals in the whitelist)
        *   - The Workflow Status must be at index= 3 i.e "VotingSessionStarted"
        */
        beforeEach(async function () {
            votingInstance = await addVoters(3);
            await votingInstance.startProposalsRegistering();
            await addProposals(votingInstance, [PROPOSAL_1, PROPOSAL_2], voter1);
            await addProposals(votingInstance, [PROPOSAL_2, PROPOSAL_3], voter2);
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
        });
        
        it('Should see that the event "Voted" is emitted when a voter vote', async function () { 
            const eventAddVoter = await votingInstance.setVote(ZERO, {from: voter1});
            const voter         = await votingInstance.getVoter(voter1);
            const proposalId    = voter.votedProposalId; 
            expectEvent(eventAddVoter, 'Voted', {voter: voter1, proposalId: new BN(proposalId)});      
        });

        it('Should see that only a registered voter can vote', async function () { 
            await (expectRevert(votingInstance.setVote(1, {from: NOT_REGISTERED_ADDR}), "You're not a voter"));
        });

        it('Should see that a registered voter can not vote for a proposal that doesn\'t exist', async function () { 
            await (expectRevert(votingInstance.setVote(new BN(999), {from:voter1}), "Proposal not found"));
        });
        
        it('Should see that a proposalId voted by a voter appears in the struct of the voter', async function () { 
            await votingInstance.setVote(ONE, {from:voter1});
            let voterHasVoted = await votingInstance.getVoter(voter1, {from: voter1});
            expect(new BN(voterHasVoted.votedProposalId)).to.be.bignumber.equal(ONE);
        });

        it('Should see that the property hasVoted of the struct voter is hydrated after the vote', async function () { 
            await votingInstance.setVote(ONE, {from:voter1});
            let voterHasVoted = await votingInstance.getVoter(voter1, {from: voter1});
            expect(voterHasVoted.hasVoted).to.be.true;
        });

        it('Should see that a voter can not vote twice', async function () { 
            await votingInstance.setVote(TWO, {from:voter1});
            await (expectRevert(votingInstance.setVote(TWO, {from:voter1}), "You have already voted"));
        });

        it('Should see that the voteCount property of the proposal struct is incremented after the vote', async function () { 
            const proposalBefore = await votingInstance.getOneProposal(ONE, {from:voter2});
            await votingInstance.setVote(ONE, {from:voter2});
            const proposalAfter = await votingInstance.getOneProposal(ONE, {from:voter2});
            expect(new BN(proposalAfter.voteCount)).to.be.bignumber.equal(new BN(proposalBefore.voteCount)+1);
        });

        it('Should see the workflow status unchanged after voting for a proposal', async function () {
            await votingInstance.setVote(ONE, {from:voter2});
            let workflowStatus = await votingInstance.workflowStatus.call({from: owner});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(THREE);
        });

        it('Should see the owner can not tally votes before ending vote session', async function () {
            await (expectRevert(votingInstance.tallyVotes({from:owner}), "Current status is not voting session ended"));
        });

        it('Everybody should see the workflowStatus at this stage', async function () { 
            let workflowStatus = await votingInstance.workflowStatus.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(THREE);
        });

        it('Everybody should see the winningProposalID at this stage with value 0', async function () { 
            const winningProposalId = await votingInstance.winningProposalID.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(winnerProposalId)).to.be.bignumber.equal(ZERO);
        });


    });    

    describe('TEST TALLIED VOTE', function () {
        /**
        * To test vote process, some conditions are required : 
        *   - Have some voters in the whitelist (we added 5 voters in the whitelist)
        *   - Have some proposals in the proposals list (we added 3 proposals in the whitelist)
        */
        beforeEach(async function () {
            votingInstance = await addVoters(5);
            await votingInstance.startProposalsRegistering();
            await addProposals(votingInstance, [PROPOSAL_1, PROPOSAL_2], voter1);
            await addProposals(votingInstance, [PROPOSAL_2, PROPOSAL_3], voter2);
            await votingInstance.endProposalsRegistering();
            await votingInstance.startVotingSession();
            await setVotes(votingInstance, proposals)
            await votingInstance.endVotingSession();

        });
        
        it('Should see a not owner voter can not vote', async function () { 
            await (expectRevert(votingInstance.tallyVotes({from: voter1}), "Ownable: caller is not the owner"));
        });

        it('Should see the event "WorkflowStatusChange" is emitted with value "VotesTallied"', async function () { 
            expectEvent(await votingInstance.tallyVotes({from: owner}), 'WorkflowStatusChange', {previousStatus: new BN(4), newStatus:new BN(5)});       
        });

        it('Should see the winningProposalID match the winner', async function () { 
            await votingInstance.tallyVotes({from: owner}); 
            const winningProposalId = await votingInstance.winningProposalID.call({from: owner});
            const winner = proposals.indexOf(Math.max(...proposals));
            expect(new BN(winnerProposalId)).to.be.bignumber.equal(new BN(winner));
        });

        it('Everybody should see the workflowStatus at this stage', async function () { 
            let workflowStatus = await votingInstance.workflowStatus.call({from: NOT_REGISTERED_ADDR});
            expect(new BN(workflowStatus)).to.be.bignumber.equal(FOUR);
        });

        it('Everybody should see the winner by getting the winningProposalID with the correct value', async function () { 
            await votingInstance.tallyVotes({from: owner}); 
            const winningProposalId = await votingInstance.winningProposalID.call({from: NOT_REGISTERED_ADDR});
            const winner = proposals.indexOf(Math.max(...proposals));
            expect(new BN(winnerProposalId)).to.be.bignumber.equal(new BN(winner));
        });
        
    });    

});


