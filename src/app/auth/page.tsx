"use client";
import { Form } from "@halvaradop/ui-form";
import { Input } from "@halvaradop/ui-input";
import { Label } from "@halvaradop/ui-label";
import { Button } from "@halvaradop/ui-button";

const AuthPage = () => {
    return (
        <section className="min-h-svh flex items-center justify-center bg-gray-100 p-4">
            <Form className="p-0">
                <Label variant="base">
                    <span className="mb-1 block">Email</span>
                    <Input type="email" name="email" placeholder="Email" required />
                </Label>
                <Label>
                    <span className="mb-1 block">Password</span>
                    <Input type="password" name="password" placeholder="Password" required />
                </Label>
                <Button className="mt-5 text-white" fullWidth>
                    Log in
                </Button>
            </Form>
        </section>
    );
};

export default AuthPage;
