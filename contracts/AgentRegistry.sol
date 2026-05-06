// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRegistry
 * @notice On-chain identity registry for NeuroVault AI agents.
 *         Each agent is owned by a wallet and tracked with role + memory size.
 *         Designed for deployment to the 0G chain.
 */
contract AgentRegistry {
    struct Agent {
        uint256 agentId;
        string name;
        string role;
        uint256 memorySize;
        address owner;
    }

    uint256 private _nextId = 1;
    mapping(uint256 => Agent) private _agents;
    mapping(address => uint256[]) private _agentsByOwner;

    event AgentCreated(uint256 indexed agentId, address indexed owner, string name, string role);
    event MemorySizeUpdated(uint256 indexed agentId, uint256 newSize);
    event OwnershipTransferred(uint256 indexed agentId, address indexed from, address indexed to);

    modifier onlyOwnerOf(uint256 agentId) {
        require(_agents[agentId].owner == msg.sender, "AgentRegistry: not owner");
        _;
    }

    function createAgent(string memory name, string memory role, uint256 memorySize)
        external
        returns (uint256)
    {
        uint256 id = _nextId++;
        _agents[id] = Agent({
            agentId: id,
            name: name,
            role: role,
            memorySize: memorySize,
            owner: msg.sender
        });
        _agentsByOwner[msg.sender].push(id);
        emit AgentCreated(id, msg.sender, name, role);
        return id;
    }

    function getAgent(uint256 agentId)
        external
        view
        returns (uint256, string memory, string memory, uint256, address)
    {
        Agent storage a = _agents[agentId];
        require(a.owner != address(0), "AgentRegistry: not found");
        return (a.agentId, a.name, a.role, a.memorySize, a.owner);
    }

    function updateMemorySize(uint256 agentId, uint256 newSize) external onlyOwnerOf(agentId) {
        _agents[agentId].memorySize = newSize;
        emit MemorySizeUpdated(agentId, newSize);
    }

    function transferOwnership(uint256 agentId, address newOwner) external onlyOwnerOf(agentId) {
        require(newOwner != address(0), "AgentRegistry: zero address");
        address prev = _agents[agentId].owner;
        _agents[agentId].owner = newOwner;
        _agentsByOwner[newOwner].push(agentId);
        emit OwnershipTransferred(agentId, prev, newOwner);
    }

    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return _agentsByOwner[owner];
    }

    function totalAgents() external view returns (uint256) {
        return _nextId - 1;
    }
}
