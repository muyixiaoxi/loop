import "./index.scss";
import { Button, Form, Input, Checkbox } from "antd";
import { useState } from "react";
import { LoginPost, RegisterPost } from "@/api/login";
import { message } from "@/utils/message";
import { generateNickname } from "@/utils/nickname";
import { useNavigate } from "react-router-dom";
import userStore from "@/store/user";

const Login = () => {
  const { setUserInfo, setToken } = userStore;
  const [form] = Form.useForm();
  const [login, setLogin] = useState<boolean>(true);
  const navigate = useNavigate();

  const onFinish = async (value: any) => {
    console.log(value);
    if (!value.deal) {
      message.error("请先阅读并同意服务协议和隐私保护指引");
      return;
    }

    if (login) {
      // 登录
      const valueParams = {
        phone: value.phone,
        password: value.password,
      };
      const result: any = await LoginPost(valueParams);
      if (result?.code === 1000) {
        setToken(result.data.token);
        setUserInfo(result.data.user);
        navigate("/home");
        message.success("登录成功");
      } else {
        message.error(result.msg);
      }
    } else {
      // 注册
      const valueParams = {
        phone: value.phone,
        password: value.password,
        nickname: generateNickname(),
      };
      const result: any = await RegisterPost(valueParams);

      // 进行登录
      if (result?.code === 1000) {
        setLogin(true);
        message.success("注册成功,请登录");
      } else {
        message.error(result.msg);
      }
    }
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
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: "请输入手机号" },
                { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少6位" },
              ]}
            >
              <Input.Password />
            </Form.Item>

            {!login && (
              <Form.Item
                name="password_ok"
                label="确认密码"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "请确认密码" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("两次密码输入不一致"));
                    },
                  }),
                ]}
              >
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

            <Button
              type="primary"
              htmlType="submit"
              className="btn"
              disabled={form
                .getFieldsError()
                .some((field) => field.errors.length > 0)}
            >
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
