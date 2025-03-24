'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import CCYNFTABI from '@/lib/abis/CCYNFT.json';

export default function MintNFT() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();

  const CCY_NFT_ADDRESS = process.env.NEXT_PUBLIC_CCY_NFT_ADDRESS || '';

  async function connectWallet() {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnected(true);
        setAccount(accounts[0]);
        toast({
          title: "钱包已连接",
          description: `连接到账户: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } else {
        toast({
          title: "MetaMask未安装",
          description: "请安装MetaMask浏览器扩展",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "连接失败",
        description: "无法连接到钱包",
        variant: "destructive",
      });
    }
  }
  
  async function mintNFT() {
    try {
      if (!name || !description || !imageUrl) {
        toast({
          title: "信息不完整",
          description: "请填写所有必要信息",
          variant: "destructive",
        });
        return;
      }
      
      setLoading(true);
      
      // 创建NFT元数据
      const metadata = {
        name,
        description,
        image: imageUrl
      };
      
      // 在实际应用中，你可能需要将元数据上传到IPFS
      // 这里我们简化为直接使用JSON字符串
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(CCY_NFT_ADDRESS, CCYNFTABI, signer);
      
      toast({
        title: "铸造中",
        description: "请在MetaMask中确认交易",
      });
      
      const tx = await nftContract.mintNFT(account, tokenURI);
      await tx.wait();
      
      toast({
        title: "铸造成功",
        description: "您的NFT已成功铸造",
      });
      
      // 清空表单
      setName('');
      setDescription('');
      setImageUrl('');
      
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      toast({
        title: "铸造失败",
        description: "无法铸造NFT，请检查网络连接和交易参数",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">铸造新NFT</h1>
      
      {!connected ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <h3 className="text-xl mb-4">请先连接您的钱包</h3>
          <Button onClick={connectWallet}>连接钱包</Button>
        </div>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>创建新NFT</CardTitle>
            <CardDescription>
              填写NFT信息并铸造
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">NFT名称</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="我的NFT"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="这是一个很棒的NFT..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">图片URL</Label>
              <Input 
                id="imageUrl" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <div className="mt-2 aspect-square w-32 overflow-hidden rounded border">
                  <img 
                    src={imageUrl} 
                    alt="NFT Preview" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={mintNFT} 
              className="w-full"
              disabled={loading || !name || !description || !imageUrl}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  铸造中...
                </>
              ) : (
                '铸造NFT'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 