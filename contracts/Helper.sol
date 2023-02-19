// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Helper {    
    /* UniswapV2Router 컨트랙트 주소 */
    address router;
    IUniswapV2Router private uniswapV2Router;
    IERC20 private tokenA_Contract;    
    IERC20 private tokenB_Contract;
    

    constructor(address router_) {
        router = router_;
        uniswapV2Router = IUniswapV2Router(router);
    }

    /// @notice 유동성 풀에 단일 토큰 예치를 지원하는 함수
    /// @param pair 예치하려는 대상 유동성 풀의 주소
    /// @param tokenA 예치에 사용할 단일 토큰의 주소
    /// @param singleAmount 예치에 사용할 단일 토큰의 예치 수량
    /// @param to LP 토큰을 수령할 사용자의 주소
    /// @param deadline 시간 제한을 둘 블록 타임스탬프
    function singleTokenAddLiquidity(
    IUniswapV2Pair pair,
    address tokenA,
    uint256 singleAmount,
    address to,
    uint256 deadline
    ) external {
    // 함수 구현

    tokenA_Contract = IERC20(tokenA);

    tokenA_Contract.transferFrom(msg.sender,address(this), singleAmount);

    console.log("======================================================");
    console.log("solidity log");
    console.log("singleTokenAddLiquidity Function start!");
    console.log("balanceOf helperContract's tokenA : ",tokenA_Contract.balanceOf(address(this)) );

    tokenA_Contract.approve(router, singleAmount);

    uint256 _amountIn = singleAmount / 2;
    uint256 _amountOutMin = 0; // 슬리피지 0

    address tokenB = getTokenB_Address(pair, tokenA);
    
    address [] memory _path = new address[](2);
    _path[0] = tokenA;
    _path[1] = tokenB;
    
    uint256 [] memory swapResult  = uniswapV2Router.swapExactTokensForTokens(_amountIn,_amountOutMin, _path, address(this), deadline);
    uint256 tokenA_amount = swapResult[0];
    uint256 tokenB_amount = swapResult[1];
    
    console.log("");    
    console.log("SWAP tokenA -> tokenB");    
    console.log("tokenA amountIn : ", _amountIn);
    console.log("");
    
    console.log("swap result");
    console.log("tokenA -> tokenB : ",tokenA_amount,"->", tokenB_amount);    
        
    tokenB_Contract = IERC20(tokenB);
    tokenB_Contract.approve(router, tokenB_amount);
    

    console.log("balanceOf helperContract's tokenA : ",tokenA_Contract.balanceOf(address(this)) );
    console.log("balanceOf helperContract's tokenB : ",tokenB_Contract.balanceOf(address(this)) );
    
    addLiquidity(tokenA, tokenB, tokenA_amount, tokenB_amount, 0, 0, to, deadline);   
    
    uint256 remainAmountTokenA = IERC20(tokenA).balanceOf(address(this));
    uint256 remainAmountTokenB = IERC20(tokenB).balanceOf(address(this));
    console.log("remainAmountTokenA ",remainAmountTokenA);
    console.log("remainAmountTokenB ",remainAmountTokenB);

    if(remainAmountTokenA > 0)IERC20(tokenA).transfer(to, remainAmountTokenA);
    if(remainAmountTokenB > 0)IERC20(tokenB).transfer(to, remainAmountTokenB);
    
    remainAmountTokenA = IERC20(tokenA).balanceOf(address(this));
    remainAmountTokenB = IERC20(tokenB).balanceOf(address(this));
    console.log("After transfer remainAmountTokenA ",remainAmountTokenA);
    console.log("After transfer remainAmountTokenB ",remainAmountTokenB);

    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) private {
    
    uint256 addTokenA; 
    uint256 addTokenB; 
    uint256 liquidity; 
    (addTokenA,addTokenB,liquidity) =  uniswapV2Router.addLiquidity(tokenA,tokenB,amountADesired,amountBDesired,amountAMin,amountBMin,to,deadline);
 
    console.log("add liquidity result");
    console.log("addTokenA : ", addTokenA);
    console.log("addTokenB : ", addTokenB);
    console.log("addLP : ", liquidity);
       
    }


    function getTokenB_Address(
    IUniswapV2Pair pair,
    address tokenA
    ) private  returns(address tokenB) {

        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        
        address token0 = pairContract.token0();
        address token1 = pairContract.token1();

        if(token0 == tokenA) return token1;
        else if(token1 == tokenA)return token0;
        else{
            revert("no tokenA pair error!");            
        }
    }




}