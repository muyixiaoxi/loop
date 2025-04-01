import "./index.scss";
import { Button, Form, Input, Checkbox } from "antd";
import { useState } from "react";
import { LoginPost } from "@/api/user";

const Login = () => {
  const [form] = Form.useForm();
  const [login, setLogin] = useState<boolean>(true);
  const onFinish = async (value: any) => {
    const result = await LoginPost(value);
    console.log(value, result);
  };
  return (
    <div className="login">
      <div className="login-container">
        <div className="logo">
          <img src="../logo.png" alt="" />
        </div>
        <div className="login-form">
          <Form
            form={form}
            name="login"
            layout="vertical"
            autoComplete="off"
            onFinish={onFinish}
          >
            <Form.Item>
              <div className="form-subtitle">{login ? "登录" : "注册"}</div>
              <div className="not-found-helper">使用Loop,让生活更美好</div>
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input />
            </Form.Item>
            <Form.Item name="password" label="密码">
              <Input.Password />
            </Form.Item>

            {!login && (
              <Form.Item name="password_ok" label="确认密码">
                <Input.Password />
              </Form.Item>
            )}

            <Form.Item>
              <Form.Item name="deal" valuePropName="checked" noStyle>
                <Checkbox>
                  已阅读并同意<a> 服务协议 </a>和<a> Loop隐私保护指引</a>
                </Checkbox>
              </Form.Item>
            </Form.Item>

            <Button type="primary" htmlType="submit" className="btn">
              {login ? "登录" : "注册"}
            </Button>

            <Form.Item>
              <a onClick={() => setLogin(!login)}>还没有账号? 去注册</a>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
