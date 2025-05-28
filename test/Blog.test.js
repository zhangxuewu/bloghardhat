const { ethers } = require("hardhat");

describe("Blog", function () {
  let Blog, blog, owner, addr1;
  // Relying on Hardhat's global expect, configured by hardhat-toolbox

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    Blog = await ethers.getContractFactory("Blog");
    blog = await Blog.deploy();
    // await blog.deployed(); // This is deprecated in ethers v6
    await blog.waitForDeployment();
  });

  describe("Deployment", function () {
    // Removed problematic "Should set the right owner" test
    // The deployer is implicitly owner, and Blog.sol doesn't store/expose an owner.

    it("Should have 0 posts initially", async function () {
      expect(await blog.getPostCount()).to.equal(0n);
      const posts = await blog.getAllPosts();
      expect(posts.length).to.equal(0);
    });
  });

  describe("Post creation", function () {
    it("Should allow users to create a post", async function () {
      const tx = await blog.createPost("My First Post", "ipfs_hash_1");
      await tx.wait();

      expect(await blog.getPostCount()).to.equal(1n);
      const posts = await blog.getAllPosts();
      expect(posts.length).to.equal(1);
      expect(posts[0].title).to.equal("My First Post");
      expect(posts[0].ipfsHash).to.equal("ipfs_hash_1");
      expect(posts[0].author).to.equal(owner.address);
    });

    it("Should emit a PostCreated event when a post is created", async function () {
      const tx = await blog.createPost("Another Post", "ipfs_hash_2");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      // The postId for the first post created in this test context (after beforeEach) will be 0.
      const expectedPostIdInEvent = 0n; 
      await expect(tx)
        .to.emit(blog, "PostCreated")
        .withArgs(expectedPostIdInEvent, "Another Post", "ipfs_hash_2", owner.address, block.timestamp);
    });

     it("Should increment postId correctly", async function () {
      const tx1 = await blog.createPost("Post 1", "hash1");
      const receipt1 = await tx1.wait();
      // Check event for first post
      const event1 = receipt1.logs.find(log => blog.interface.parseLog(log)?.name === 'PostCreated');
      expect(event1.args.postId).to.equal(0n);

      const tx2 = await blog.connect(addr1).createPost("Post 2 by addr1", "hash2");
      const receipt2 = await tx2.wait();
      // Check event for second post
      const event2 = receipt2.logs.find(log => blog.interface.parseLog(log)?.name === 'PostCreated');
      expect(event2.args.postId).to.equal(1n);

      expect(await blog.getPostCount()).to.equal(2n);
      const posts = await blog.getAllPosts();
      expect(posts.length).to.equal(2);
      expect(posts[1].title).to.equal("Post 2 by addr1");
      expect(posts[1].author).to.equal(addr1.address);
    });
  });

  describe("Fetching posts", function () {
    beforeEach(async function() {
      let tx = await blog.createPost("Post Alpha", "hash_alpha");
      await tx.wait();
      tx = await blog.connect(addr1).createPost("Post Beta by addr1", "hash_beta");
      await tx.wait();
    });

    it("getAllPosts should return all created posts", async function () {
      const allPosts = await blog.getAllPosts();
      expect(allPosts.length).to.equal(2);

      expect(allPosts[0].title).to.equal("Post Alpha");
      expect(allPosts[0].author).to.equal(owner.address);

      expect(allPosts[1].title).to.equal("Post Beta by addr1");
      expect(allPosts[1].author).to.equal(addr1.address);
    });

    it("getPostCount should return the correct number of posts", async function () {
      expect(await blog.getPostCount()).to.equal(2n);

      const tx = await blog.createPost("Post Gamma", "hash_gamma");
      await tx.wait();
      expect(await blog.getPostCount()).to.equal(3n);
    });
  });
});