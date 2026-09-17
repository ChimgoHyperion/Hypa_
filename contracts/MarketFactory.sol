// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PredictionMarket.sol";

contract MarketFactory {
    // ─── State ────────────────────────────────────────────────
    address[] public allMarkets;

    // Platform admin — manages the creator whitelist
    address public admin;

    // Addresses allowed to call createMarket
    mapping(address => bool) public canCreate;

    // Track which markets a creator made
    mapping(address => address[]) public marketsByCreator;

    // Prevent the same market from being listed twice
    mapping(address => bool) public isListed;

    // ─── Events ───────────────────────────────────────────────

    event MarketCreated(
        address indexed marketAddress,
        string question,
        string category,
        uint256 endTime,
        address indexed creator
    );

    event CreatorUpdated(address indexed account, bool allowed);
    event MarketsImported(uint256 count);

    constructor() {
        admin = msg.sender;
        canCreate[msg.sender] = true;
        emit CreatorUpdated(msg.sender, true);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyCreator() {
        require(canCreate[msg.sender], "Not authorized to create markets");
        _;
    }

    // ─── Access control ───────────────────────────────────────

    function addCreator(address account) external onlyAdmin {
        require(account != address(0), "Zero address");
        canCreate[account] = true;
        emit CreatorUpdated(account, true);
    }

    function removeCreator(address account) external onlyAdmin {
        require(account != admin, "Cannot remove admin");
        canCreate[account] = false;
        emit CreatorUpdated(account, false);
    }

    // ─── Market Creation ───────────────────────────────────────

    function createMarket(
        string memory _question,
        uint256 _endTime,
        string memory _category
    ) external onlyCreator returns (address) {
        PredictionMarket market = new PredictionMarket(
            _question,
            _category,
            _endTime,
            msg.sender
        );

        address marketAddress = address(market);

        allMarkets.push(marketAddress);
        isListed[marketAddress] = true;
        marketsByCreator[msg.sender].push(marketAddress);

        emit MarketCreated(
            marketAddress,
            _question,
            _category,
            _endTime,
            msg.sender
        );

        return marketAddress;
    }

    /**
     * Register markets deployed by a previous factory so the UI keeps
     * listing them after an upgrade. Does not change market ownership.
     */
    function importMarkets(address[] calldata markets) external onlyAdmin {
        uint256 added;
        for (uint256 i = 0; i < markets.length; i++) {
            address market = markets[i];
            if (market == address(0) || isListed[market]) continue;
            allMarkets.push(market);
            isListed[market] = true;
            added++;
        }
        emit MarketsImported(added);
    }

    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    function getMarketsByCreator(
        address creator
    ) external view returns (address[] memory) {
        return marketsByCreator[creator];
    }
}
