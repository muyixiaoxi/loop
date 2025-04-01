import "./index.sass";
import { useState } from "react";
import { login } from "@/apis/user";

const Home = () => {
  const [data, setdata] = useState({
    phone: '18186328416',
    password:'123'
  })
    // 定义 handleclick 方法
    const handleclick = async() => {
      const result = await login(data)
      console.log(result)
    };

    return (
        <>
            <div onClick={handleclick}>
                123
            </div>
        </>
    );
};

export default Home;