// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract Blog {
    struct Post {
        string title;
        string ipfsHash;
        address author;
        uint timestamp;
    }

    Post[] public posts;

    event PostCreated(
        uint postId,
        string title,
        string ipfsHash,
        address author,
        uint timestamp
    );

    function createPost(string memory _title, string memory _ipfsHash) public {
        uint postId = posts.length;
        posts.push(Post(_title, _ipfsHash, msg.sender, block.timestamp));
        emit PostCreated(postId, _title, _ipfsHash, msg.sender, block.timestamp);
    }

    function getAllPosts() public view returns (Post[] memory) {
        return posts;
    }

    function getPostCount() public view returns (uint) {
        return posts.length;
    }
}