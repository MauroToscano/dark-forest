const Migrations = artifacts.require("Migrations");
const Positions = artifacts.require("Positions");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Positions);
};
